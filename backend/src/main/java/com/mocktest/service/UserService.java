package com.mocktest.service;

import com.mocktest.dto.response.UserDto;
import com.mocktest.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        return userRepository.findAllByOrderByFullNameAsc().stream()
                .map(u -> new UserDto(u.getId(), u.getFullName(), u.getEmail(), u.getRole().name()))
                .toList();
    }
}
