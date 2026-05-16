package org.example.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.example.entity.dto.Account;
import org.example.mapper.AccountMapper;
import org.example.service.AccountService;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class AccountIServiceImpl extends ServiceImpl<AccountMapper, Account> implements AccountService {

    @Resource
    PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String test) throws UsernameNotFoundException {
        Account account = this.findAccountByNameOrEmail(test);
        if (account == null) {
            throw new UsernameNotFoundException("用户名或密码错误");
        }
        return User
                .withUsername(test)
                .password(account.getPassword())
                .roles(account.getRole())
                .build();
    }

    public Account findAccountByNameOrEmail(String test) {
        return this.query()
                .eq("username", test).or()
                .eq("email", test)
                .one();
    }

    @Override
    public String verifyRole(String username) {
        log.info("查询用户角色，用户名: {}", username);

        if (username == null || username.isEmpty()) {
            log.warn("用户名为空");
            return "user";
        }

        try {
            Account account = this.getOne(
                    new QueryWrapper<Account>()
                            .eq("username", username)
            );

            log.info("查询结果 - account: {}", account);

            if (account != null && account.getRole() != null) {
                log.info("用户角色: {}", account.getRole());
                return account.getRole();
            } else {
                log.warn("未找到用户名为 {} 的账户或角色为空，返回默认角色", username);
                return "user";
            }
        } catch (Exception e) {
            log.error("查询用户角色时发生异常", e);
            return "user";
        }
    }

}
