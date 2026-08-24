package zm.unza.cict.specification.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import zm.unza.cict.specification.dto.request.RequestAttachmentResponse;
import zm.unza.cict.specification.security.CurrentUser;
import zm.unza.cict.specification.service.RequestAttachmentService;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class RequestAttachmentController {

    private final RequestAttachmentService attachmentService;

    @GetMapping("/api/requests/{requestId}/attachments")
    public List<RequestAttachmentResponse> list(@PathVariable UUID requestId) {
        return attachmentService.list(requestId, CurrentUser.get());
    }

    @PostMapping(value = "/api/requests/{requestId}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public RequestAttachmentResponse upload(@PathVariable UUID requestId,
                                             @RequestParam("file") MultipartFile file,
                                             @RequestParam(required = false) String kind) {
        return attachmentService.upload(requestId, file, kind, CurrentUser.get());
    }

    @GetMapping("/api/attachments/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable UUID id) {
        var meta = attachmentService.get(id);
        Resource resource = attachmentService.download(id, CurrentUser.get());
        return ResponseEntity.ok()
                .contentType(meta.contentType() != null ? MediaType.parseMediaType(meta.contentType()) : MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(meta.fileName()).build().toString())
                .body(resource);
    }

    @DeleteMapping("/api/attachments/{id}")
    public void delete(@PathVariable UUID id) {
        attachmentService.delete(id, CurrentUser.get());
    }
}
