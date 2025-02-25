package com.example.springbootworkload;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Autowired;

import jakarta.persistence.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;

// -- Start of single-file demo --
@SpringBootApplication
public class MainApplication {
    public static void main(String[] args) {
        SpringApplication.run(MainApplication.class, args);
    }
}

// ---------------------------
// Entities
// ---------------------------
@Entity
class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    @Column(unique = true)
    private String email;
    private String password;      // For demo, store in plaintext
    private Long orgId;
    private boolean emailVerified;
    private String accessRole;    // e.g. "admin" or "member"

    // Constructors, getters, setters
    public User() {}
    public User(String name, String email, String password, Long orgId, boolean emailVerified, String accessRole) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.orgId = orgId;
        this.emailVerified = emailVerified;
        this.accessRole = accessRole;
    }
    // getters and setters omitted for brevity
    // ...
    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String n) { name = n; }
    public String getEmail() { return email; }
    public void setEmail(String e) { email = e; }
    public String getPassword() { return password; }
    public void setPassword(String p) { password = p; }
    public Long getOrgId() { return orgId; }
    public void setOrgId(Long o) { orgId = o; }
    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean v) { emailVerified = v; }
    public String getAccessRole() { return accessRole; }
    public void setAccessRole(String r) { accessRole = r; }
}

@Entity
class Organization {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Organization() {}
    public Organization(String name, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.name = name;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    // getters and setters omitted for brevity
    // ...
    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String n) { name = n; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime c) { createdAt = c; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime u) { updatedAt = u; }
}

@Entity
class OrgMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long orgId;
    private Long userId;
    private String role;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public OrgMember() {}
    public OrgMember(Long orgId, Long userId, String role,
                     LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.orgId = orgId;
        this.userId = userId;
        this.role = role;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    // getters, setters
    // ...
    public Long getId() { return id; }
    public Long getOrgId() { return orgId; }
    public void setOrgId(Long o) { orgId = o; }
    public Long getUserId() { return userId; }
    public void setUserId(Long u) { userId = u; }
    public String getRole() { return role; }
    public void setRole(String r) { role = r; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime c) { createdAt = c; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime u) { updatedAt = u; }
}

@Entity
class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private Long orgMemberId;
    private LocalDate startDate;
    private LocalDate endDate;
    private String description;

    public Task() {}
    public Task(String name, Long orgMemberId, LocalDate startDate,
                LocalDate endDate, String description) {
        this.name = name;
        this.orgMemberId = orgMemberId;
        this.startDate = startDate;
        this.endDate = endDate;
        this.description = description;
    }
    // getters, setters
    // ...
    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String n) { name = n; }
    public Long getOrgMemberId() { return orgMemberId; }
    public void setOrgMemberId(Long o) { orgMemberId = o; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate s) { startDate = s; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate e) { endDate = e; }
    public String getDescription() { return description; }
    public void setDescription(String d) { description = d; }
}

@Entity
class Otp {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long userId;
    private String otp;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;

    public Otp() {}
    public Otp(Long userId, String otp, LocalDateTime createdAt, LocalDateTime expiresAt) {
        this.userId = userId;
        this.otp = otp;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
    }
    // getters, setters
    // ...
    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long u) { userId = u; }
    public String getOtp() { return otp; }
    public void setOtp(String o) { otp = o; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime c) { createdAt = c; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime e) { expiresAt = e; }
}

// ---------------------------
// Repositories
// ---------------------------
interface UserRepository extends JpaRepository<User, Long> {
    User findByEmail(String email);
}

interface OrganizationRepository extends JpaRepository<Organization, Long> { }

interface OrgMemberRepository extends JpaRepository<OrgMember, Long> { 
    List<OrgMember> findByOrgId(Long orgId);
    OrgMember findByUserId(Long userId);
}

interface TaskRepository extends JpaRepository<Task, Long> {
    // We'll filter by orgId using a join in code or a custom query if we want
}

interface OtpRepository extends JpaRepository<Otp, Long> {
    Otp findByUserIdAndOtp(Long userId, String otp);
}

// ---------------------------
// DTOs
// ---------------------------
class SignupRequest {
    public String name;
    public String email;
}

class OTPVerifyRequest {
    public Long user_id;
    public String otp;
    public String password;
}

class LoginRequest {
    public String email;
    public String password;
}

class TaskCreate {
    public String name;
    public Long org_member_id;
    public LocalDate start_date;
    public LocalDate end_date;
    public String description;
}

// ---------------------------
// REST Controllers
// ---------------------------
@RestController
@RequestMapping
class MainController {

    @Autowired
    private UserRepository userRepo;
    @Autowired
    private OrganizationRepository orgRepo;
    @Autowired
    private OrgMemberRepository orgMemberRepo;
    @Autowired
    private TaskRepository taskRepo;
    @Autowired
    private OtpRepository otpRepo;

    // 1) Login
    @PostMapping("/login/")
    public Object login(@RequestBody LoginRequest req) {
        User user = userRepo.findByEmail(req.email);
        if (user == null) {
            throw new RuntimeException("Email not found");
        }
        if (!user.getPassword().equals(req.password)) {
            throw new RuntimeException("Incorrect password");
        }
        return user; // Return user object (or a custom response)
    }

    // 2) Get Users (optionally filter by orgId)
    @GetMapping("/users/")
    public List<User> getUsers(@RequestParam(required = false) Long orgId) {
        if (orgId == null) {
            return userRepo.findAll();
        } else {
            // Filter manually or with a custom query
            return userRepo.findAll().stream()
                .filter(u -> orgId.equals(u.getOrgId()))
                .toList();
        }
    }

    // 3) Create a new Task
    @PostMapping("/tasks/")
    public Task createTask(@RequestBody TaskCreate taskDto) {
        Task task = new Task(
            taskDto.name,
            taskDto.org_member_id,
            taskDto.start_date,
            taskDto.end_date,
            taskDto.description
        );
        return taskRepo.save(task);
    }

    // 4) Get tasks (optionally filter by orgId via orgMember)
    @GetMapping("/tasks/")
    public List<Task> getTasks(@RequestParam(required = false) Long orgId) {
        if (orgId == null) {
            return taskRepo.findAll();
        }
        // Filter tasks by checking if their org_member_id belongs to orgId
        List<Task> allTasks = taskRepo.findAll();
        return allTasks.stream()
            .filter(t -> {
                OrgMember om = orgMemberRepo.findById(t.getOrgMemberId()).orElse(null);
                return om != null && orgId.equals(om.getOrgId());
            })
            .toList();
    }

    // 5) OrgMembers (optionally filter by orgId)
    @GetMapping("/orgmembers/")
    public List<OrgMember> getOrgMembers(@RequestParam Long orgId) {
        return orgMemberRepo.findByOrgId(orgId);
    }

    // 6) OrgMember by userId
    @GetMapping("/orgmember/byuser/")
    public OrgMember getOrgMemberByUser(@RequestParam Long userId) {
        OrgMember om = orgMemberRepo.findByUserId(userId);
        if (om == null) {
            throw new RuntimeException("No OrgMember found for user " + userId);
        }
        return om;
    }

    // 7) Signup
    @PostMapping("/signup/")
    public Object signup(@RequestBody SignupRequest req) {
        // 1. Create new organization
        Organization org = new Organization(
            req.name + "'s Organization",
            LocalDateTime.now(),
            LocalDateTime.now()
        );
        org = orgRepo.save(org);

        // 2. Create user
        User user = new User(
            req.name,
            req.email,
            null,  // password not set yet
            org.getId(),
            false,
            "admin"
        );
        // Check for duplicate email
        if (userRepo.findByEmail(req.email) != null) {
            throw new RuntimeException("Email already exists");
        }
        user = userRepo.save(user);

        // 3. Create orgMember
        OrgMember om = new OrgMember(
            org.getId(),
            user.getId(),
            "admin",
            LocalDateTime.now(),
            LocalDateTime.now()
        );
        om = orgMemberRepo.save(om);

        // 4. Generate OTP
        Random r = new Random();
        int code = 100000 + r.nextInt(900000);
        Otp otp = new Otp(
            user.getId(),
            String.valueOf(code),
            LocalDateTime.now(),
            LocalDateTime.now().plusMinutes(2)
        );
        otp = otpRepo.save(otp);

        return new Object() {
            public String message = "Signup successful. Use the OTP to verify and set your password.";
            public Long user_id = user.getId();
            public String generated_otp = otp.getOtp();
        };
    }

    // 8) Verify OTP
    @PostMapping("/verify-otp/")
    public Object verifyOtp(@RequestBody OTPVerifyRequest req) {
        Otp record = otpRepo.findByUserIdAndOtp(req.user_id, req.otp);
        if (record == null) {
            throw new RuntimeException("Invalid OTP");
        }
        if (record.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP expired");
        }
        // Mark user as verified and set password
        Optional<User> maybeUser = userRepo.findById(req.user_id);
        if (maybeUser.isEmpty()) {
            throw new RuntimeException("User not found");
        }
        User u = maybeUser.get();
        u.setEmailVerified(true);
        u.setPassword(req.password);
        userRepo.save(u);

        return new Object() {
            public String message = "OTP verified and password set successfully.";
        };
    }
}
// -- End of single-file demo --
