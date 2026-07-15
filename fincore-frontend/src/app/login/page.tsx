"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { authService } from "@/services/auth";
import { Lock, Mail, Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react";

// Form schemas
const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải từ 6 ký tự trở lên"),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Vui lòng nhập mật khẩu tạm thời"),
  newPassword: z.string().min(6, "Mật khẩu mới phải từ 6 ký tự trở lên"),
  confirmPassword: z.string().min(6, "Vui lòng xác nhận lại mật khẩu mới"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

const forgotPwdSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
type ForgotPwdFormValues = z.infer<typeof forgotPwdSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Flow states
  const [isTempPasswordFlow, setIsTempPasswordFlow] = useState(false);
  const [isForgotPasswordFlow, setIsForgotPasswordFlow] = useState(false);
  const [tempCredentials, setTempCredentials] = useState<{ email: string } | null>(null);

  // Forms hook
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerChangePwd,
    handleSubmit: handleChangePwdSubmit,
    formState: { errors: changePwdErrors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const {
    register: registerForgotPwd,
    handleSubmit: handleForgotPwdSubmit,
    formState: { errors: forgotPwdErrors },
    reset: resetForgotPwd,
  } = useForm<ForgotPwdFormValues>({
    resolver: zodResolver(forgotPwdSchema),
  });

  // Handle Login Click
  const onLogin = async (values: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(values);
      if (response.isPasswordTemp) {
        // Switch to Change Password flow
        setTempCredentials({ email: values.email });
        setIsTempPasswordFlow(true);
        setSuccessMessage("Đăng nhập thành công! Đây là lần đầu đăng nhập, bạn cần đổi mật khẩu mới.");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Change Password Click
  const onChangePassword = async (values: ChangePasswordFormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await authService.changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      setSuccessMessage("Đổi mật khẩu thành công! Đang chuyển hướng vào hệ thống...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Forgot Password Click
  const onForgotPwdSubmit = async (values: ForgotPwdFormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await authService.forgotPassword(values.email);
      setSuccessMessage(`Đã gửi mật khẩu tạm mới đến email ${values.email}. Vui lòng kiểm tra hộp thư của bạn.`);
      resetForgotPwd();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Email không tồn tại hoặc có lỗi xảy ra. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4 font-sans selection:bg-emerald-600/20 selection:text-emerald-700 relative overflow-hidden">
      {/* Ambient background soft depth blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-100/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] bg-teal-100/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Gentle mint diagonal wave sweep traveling across the screen */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute w-[350vw] h-[280px] bg-gradient-to-r from-transparent via-emerald-200/20 via-teal-200/25 via-emerald-200/20 to-transparent blur-[70px] opacity-90 animate-sweep"
          style={{ transformOrigin: "center center" }}
        />
      </div>

      {/* Premium radial grid dots overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: `radial-gradient(#10b981 1.5px, transparent 1.5px)`,
          backgroundSize: "28px 28px"
        }}
      />

      {/* Keyframe animations for diagonal sweep */}
      <style>{`
        @keyframes sweep-diagonal {
          0% {
            transform: translate(-100%, -100%) rotate(-40deg);
          }
          100% {
            transform: translate(80%, 80%) rotate(-40deg);
          }
        }
        .animate-sweep {
          animation: sweep-diagonal 11s infinite linear;
        }
      `}</style>

      {/* Premium Glassmorphic Light Card */}
      <div className="relative w-full max-w-md bg-white border border-zinc-200/80 p-8 rounded-3xl shadow-[0_25px_60px_-15px_rgba(16,185,129,0.06)] shadow-zinc-200/40 z-10 overflow-hidden">
        {/* Premium Neon Top Accent Line */}
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500" />

        {/* Brand Header */}
        <div className="text-center mb-8 relative">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
            Fin<span className="text-emerald-600 drop-shadow-[0_2px_10px_rgba(16,185,129,0.15)]">Core</span>
          </h1>
          <p className="mt-2 text-sm font-semibold text-zinc-500 tracking-wide">
            Hệ thống Quản lý Tài chính Câu lạc bộ
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            {error}
          </div>
        )}

        {/* Global Success Banner */}
        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-250 text-emerald-800 text-sm rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 1. Login Form */}
        {!isTempPasswordFlow && !isForgotPasswordFlow && (
          <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">
                Địa chỉ Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  disabled={isLoading}
                  placeholder="name@fincore.com"
                  {...registerLogin("email")}
                  className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder-zinc-400 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/10 focus:shadow-[0_0_15px_rgba(16,185,129,0.08)] transition-all disabled:opacity-50"
                />
              </div>
              {loginErrors.email && (
                <p className="mt-1.5 text-xs text-red-600">{loginErrors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-zinc-700">
                  Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPasswordFlow(true);
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  disabled={isLoading}
                  placeholder="••••••••"
                  {...registerLogin("password")}
                  className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder-zinc-400 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/10 focus:shadow-[0_0_15px_rgba(16,185,129,0.08)] transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-650 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              {loginErrors.password && (
                <p className="mt-1.5 text-xs text-red-600">{loginErrors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-750 hover:to-teal-600 text-white font-extrabold py-3.5 px-4 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(16,185,129,0.15)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.25)] cursor-pointer active:scale-[0.98]"
            >
              {isLoading ? "Đang xử lý..." : "Đăng nhập"}
            </button>
          </form>
        )}

        {/* 2. Forgot Password Form */}
        {isForgotPasswordFlow && (
          <form onSubmit={handleForgotPwdSubmit(onForgotPwdSubmit)} className="space-y-6">
            <div className="text-xs text-zinc-500 leading-relaxed bg-zinc-50 border border-zinc-200/60 p-3.5 rounded-xl">
              Nhập địa chỉ email đã đăng ký của bạn. Hệ thống sẽ tự động tạo mật khẩu tạm thời mới và gửi trực tiếp về email của bạn.
            </div>

            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">
                Địa chỉ Email đăng ký
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  disabled={isLoading}
                  placeholder="name@fincore.com"
                  {...registerForgotPwd("email")}
                  className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder-zinc-400 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/10 focus:shadow-[0_0_15px_rgba(16,185,129,0.08)] transition-all disabled:opacity-50"
                />
              </div>
              {forgotPwdErrors.email && (
                <p className="mt-1.5 text-xs text-red-600">{forgotPwdErrors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-750 hover:to-teal-600 text-white font-extrabold py-3.5 px-4 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(16,185,129,0.15)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.25)] cursor-pointer active:scale-[0.98]"
            >
              {isLoading ? "Đang gửi..." : "Gửi mật khẩu mới"}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsForgotPasswordFlow(false);
                setError(null);
                setSuccessMessage(null);
              }}
              className="w-full flex items-center justify-center gap-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-bold py-3.5 px-4 rounded-xl text-sm transition-all border border-zinc-200/80 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại đăng nhập
            </button>
          </form>
        )}

        {/* 3. Force Change Password Form */}
        {isTempPasswordFlow && (
          <form onSubmit={handleChangePwdSubmit(onChangePassword)} className="space-y-6">
            <div className="text-xs text-zinc-500 leading-relaxed bg-zinc-50 border border-zinc-200/60 p-3.5 rounded-xl">
              Tài khoản của bạn: <strong className="text-zinc-900">{tempCredentials?.email}</strong> đang sử dụng mật khẩu tạm thời. Vui lòng thay đổi mật khẩu để tiếp tục.
            </div>

            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">
                Mật khẩu tạm thời đã cấp
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  disabled={isLoading}
                  placeholder="Nhập mật khẩu tạm thời"
                  {...registerChangePwd("oldPassword")}
                  className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder-zinc-400 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/10 focus:shadow-[0_0_15px_rgba(16,185,129,0.08)] transition-all disabled:opacity-50"
                />
              </div>
              {changePwdErrors.oldPassword && (
                <p className="mt-1.5 text-xs text-red-600">{changePwdErrors.oldPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">
                Mật khẩu mới
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  disabled={isLoading}
                  placeholder="Tối thiểu 6 ký tự"
                  {...registerChangePwd("newPassword")}
                  className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder-zinc-400 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/10 focus:shadow-[0_0_15px_rgba(16,185,129,0.08)] transition-all disabled:opacity-50"
                />
              </div>
              {changePwdErrors.newPassword && (
                <p className="mt-1.5 text-xs text-red-600">{changePwdErrors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">
                Nhập lại mật khẩu mới
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  disabled={isLoading}
                  placeholder="Xác nhận mật khẩu mới"
                  {...registerChangePwd("confirmPassword")}
                  className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder-zinc-400 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/10 focus:shadow-[0_0_15px_rgba(16,185,129,0.08)] transition-all disabled:opacity-50"
                />
              </div>
              {changePwdErrors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-600">{changePwdErrors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-750 hover:to-teal-600 text-white font-extrabold py-3.5 px-4 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(16,185,129,0.15)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.25)] cursor-pointer active:scale-[0.98]"
            >
              {isLoading ? "Đang xử lý..." : "Cập nhật & Đăng nhập"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
