package zm.unza.cict.specification.service;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import zm.unza.cict.specification.common.exception.BadRequestException;
import zm.unza.cict.specification.common.exception.ForbiddenException;
import zm.unza.cict.specification.common.exception.NotFoundException;
import zm.unza.cict.specification.config.AppProperties;
import zm.unza.cict.specification.domain.Request;
import zm.unza.cict.specification.domain.RequestAttachment;
import zm.unza.cict.specification.domain.User;
import zm.unza.cict.specification.dto.request.RequestAttachmentResponse;
import zm.unza.cict.specification.repository.RequestAttachmentRepository;
import zm.unza.cict.specification.repository.RequestRepository;
import zm.unza.cict.specification.security.AuthenticatedUser;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RequestAttachmentService {

    /** Quotations, memoranda, asset photographs and approval correspondence — no executables or scripts. */
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv",
            "jpg", "jpeg", "png", "gif", "webp", "heic"
    );

    private final RequestAttachmentRepository attachmentRepository;
    private final RequestRepository requestRepository;
    private final RequestAccessService accessService;
    private final AppProperties appProperties;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<RequestAttachmentResponse> list(UUID requestId, AuthenticatedUser user) {
        Request request = requestRepository.findById(requestId).orElseThrow(() -> new NotFoundException("Request not found."));
        accessService.assertCanView(user, request);
        return attachmentRepository.findByRequestIdOrderByCreatedAtDesc(requestId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public RequestAttachmentResponse upload(UUID requestId, MultipartFile file, String kind, AuthenticatedUser user) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("No file was provided.");
        }
        Request request = requestRepository.findById(requestId).orElseThrow(() -> new NotFoundException("Request not found."));
        accessService.assertCanView(user, request);

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String extension = extensionOf(originalName);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException(
                    "That file type isn't allowed. Upload a PDF, Word, Excel, PowerPoint, text or image file.");
        }
        String safeName = originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
        String storedName = UUID.randomUUID() + "-" + safeName;
        String relativePath = requestId + "/" + storedName;

        try {
            Path root = Path.of(appProperties.storage().attachmentsDir()).toAbsolutePath().normalize();
            Path target = root.resolve(relativePath).normalize();
            if (!target.startsWith(root)) {
                throw new BadRequestException("Invalid file name.");
            }
            Files.createDirectories(target.getParent());
            file.transferTo(target);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to store attachment", e);
        }

        RequestAttachment attachment = RequestAttachment.builder()
                .request(request)
                .storagePath(relativePath)
                .fileName(originalName)
                .contentType(file.getContentType())
                .sizeBytes(file.getSize())
                .kind(kind != null ? kind : "supporting_document")
                .uploadedBy(User.builder().id(user.id()).build())
                .build();
        attachment = attachmentRepository.save(attachment);
        auditLogService.log("RequestAttachment", attachment.getId().toString(), "upload",
                "Uploaded '" + originalName + "' on request " + requestId);
        return toResponse(attachment);
    }

    @Transactional(readOnly = true)
    public Resource download(UUID attachmentId, AuthenticatedUser user) {
        RequestAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new NotFoundException("Attachment not found."));
        accessService.assertCanView(user, attachment.getRequest());
        Path root = Path.of(appProperties.storage().attachmentsDir()).toAbsolutePath().normalize();
        Path target = root.resolve(attachment.getStoragePath()).normalize();
        if (!Files.exists(target)) {
            throw new NotFoundException("Attachment file is missing on disk.");
        }
        return new FileSystemResource(target);
    }

    @Transactional(readOnly = true)
    public RequestAttachmentResponse get(UUID attachmentId) {
        return toResponse(attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new NotFoundException("Attachment not found.")));
    }

    @Transactional
    public void delete(UUID attachmentId, AuthenticatedUser user) {
        RequestAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new NotFoundException("Attachment not found."));
        boolean owner = attachment.getUploadedBy().getId().equals(user.id());
        if (!owner && !user.isCict()) {
            throw new ForbiddenException("You cannot delete this attachment.");
        }
        Path root = Path.of(appProperties.storage().attachmentsDir()).toAbsolutePath().normalize();
        Path target = root.resolve(attachment.getStoragePath()).normalize();
        try {
            Files.deleteIfExists(target);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to delete attachment file", e);
        }
        auditLogService.log("RequestAttachment", attachment.getId().toString(), "delete",
                "Deleted '" + attachment.getFileName() + "' on request " + attachment.getRequest().getId());
        attachmentRepository.delete(attachment);
    }

    private String extensionOf(String fileName) {
        int dot = fileName.lastIndexOf('.');
        if (dot < 0 || dot == fileName.length() - 1) return "";
        return fileName.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private RequestAttachmentResponse toResponse(RequestAttachment a) {
        return new RequestAttachmentResponse(
                a.getId(), a.getRequest().getId(), a.getFileName(), a.getContentType(), a.getSizeBytes(),
                a.getKind(), a.getUploadedBy().getId(), a.getCreatedAt()
        );
    }
}
