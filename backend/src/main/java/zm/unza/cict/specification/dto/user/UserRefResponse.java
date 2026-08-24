package zm.unza.cict.specification.dto.user;

import java.util.UUID;

/** Lightweight user reference used when embedding a user inside another resource. */
public record UserRefResponse(UUID id, String fullName, String email) {
}
