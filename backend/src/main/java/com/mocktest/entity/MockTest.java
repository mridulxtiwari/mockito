package com.mocktest.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "mock_tests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MockTest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private Integer durationMinutes;

    @Column(nullable = false)
    private Integer totalMarks;

    @Column(nullable = false)
    private Integer passingMarks;

    @Builder.Default
    private Double negativeMarks = 0.0;

    @Builder.Default
    private Boolean isActive = true;

    private String difficulty; // EASY, MEDIUM, HARD

    @Enumerated(EnumType.STRING)
    @Column(name = "access_type", length = 32)
    @Builder.Default
    private TestAccessType accessType = TestAccessType.COMMON;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "test_assigned_users",
            joinColumns = @JoinColumn(name = "test_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @Builder.Default
    private java.util.Set<User> assignedUsers = new java.util.HashSet<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "test", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    private List<Question> questions = new ArrayList<>();
}
