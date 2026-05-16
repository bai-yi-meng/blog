package org.example.controller;

import jakarta.annotation.Resource;
import org.example.entity.RestBean;
import org.example.service.AccountService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthorizeController {

    @Resource
    AccountService accountService;

    @PostMapping("/verify-role")
    public RestBean<String> verifyRole(@RequestBody Map<String, String> requestBody){
        String username = requestBody.get("username");
        if (username == null || username.isEmpty()) {
            return RestBean.failure(400, "用户名不能为空");
        }
        String role = accountService.verifyRole(username);
        return RestBean.success(role);
    }

}
