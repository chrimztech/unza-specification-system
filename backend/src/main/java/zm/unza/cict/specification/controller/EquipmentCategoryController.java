package zm.unza.cict.specification.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import zm.unza.cict.specification.common.exception.ForbiddenException;
import zm.unza.cict.specification.dto.catalogue.EquipmentCategoryRequest;
import zm.unza.cict.specification.dto.catalogue.EquipmentCategoryResponse;
import zm.unza.cict.specification.security.CurrentUser;
import zm.unza.cict.specification.service.EquipmentCategoryService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/equipment-categories")
@RequiredArgsConstructor
public class EquipmentCategoryController {

    private final EquipmentCategoryService categoryService;

    @GetMapping
    public List<EquipmentCategoryResponse> list() {
        return categoryService.list();
    }

    @PostMapping
    public EquipmentCategoryResponse create(@Valid @RequestBody EquipmentCategoryRequest req) {
        requireAdmin();
        return categoryService.create(req);
    }

    @PutMapping("/{id}")
    public EquipmentCategoryResponse update(@PathVariable UUID id, @Valid @RequestBody EquipmentCategoryRequest req) {
        requireAdmin();
        return categoryService.update(id, req);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        requireAdmin();
        categoryService.delete(id);
    }

    private void requireAdmin() {
        if (!CurrentUser.get().isAdmin()) {
            throw new ForbiddenException("Administrators only.");
        }
    }
}
