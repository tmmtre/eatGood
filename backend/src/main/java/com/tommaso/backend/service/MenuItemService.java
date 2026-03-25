package com.tommaso.backend.service;

import com.tommaso.backend.model.MenuItem;
import com.tommaso.backend.model.MenuSection;
import com.tommaso.backend.repository.MenuItemRepository;
import com.tommaso.backend.repository.MenuSectionRepository;
import com.tommaso.backend.s3.S3Buckets;
import com.tommaso.backend.s3.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MenuItemService {

    private final MenuItemRepository menuItemRepository;
    private final MenuSectionRepository menuSectionRepository;
    private final S3Service s3Service;
    private final S3Buckets s3Buckets;

    public List<MenuItem> findBySectionId(Long sectionId) {
        return menuItemRepository.findBySectionId(sectionId);
    }

    public MenuItem findById(Long id) {
        return menuItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Menu Item not found"));
    }

    public MenuItem create(Long sectionId, MenuItem item, MultipartFile image) throws IOException {
        MenuSection section = menuSectionRepository.findById(sectionId)
                .orElseThrow(() -> new RuntimeException("Menu Section not found"));

        if (image != null && !image.isEmpty()) {
            String key = "menu-items/" + UUID.randomUUID() + "-" + image.getOriginalFilename();
            s3Service.putObject(s3Buckets.getRestaurant(), key, image.getBytes());
            item.setImageUrl(key);
        }

        item.setSection(section);
        return menuItemRepository.save(item);
    }

    public MenuItem update(Long id, MenuItem updated, MultipartFile image) throws IOException {
        MenuItem existing = findById(id);
        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        existing.setPrice(updated.getPrice());
        existing.setAvailable(updated.getAvailable());

        if (image != null && !image.isEmpty()) {
            String key = "menu-items/" + UUID.randomUUID() + "-" + image.getOriginalFilename();
            s3Service.putObject(s3Buckets.getRestaurant(), key, image.getBytes());
            existing.setImageUrl(key);
        }

        return menuItemRepository.save(existing);
    }

    public void delete(Long id) {
        menuItemRepository.deleteById(id);
    }
}
