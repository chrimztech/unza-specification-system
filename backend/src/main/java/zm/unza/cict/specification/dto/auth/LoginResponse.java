package zm.unza.cict.specification.dto.auth;

import zm.unza.cict.specification.dto.user.UserResponse;

public record LoginResponse(String token, UserResponse user) {
}
