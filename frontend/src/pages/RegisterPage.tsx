import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  LinearProgress,
  Snackbar,
  Alert,
  InputAdornment,
  IconButton
} from "@mui/material";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import authApi from "../api/authApi";

const schema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters"),

    email: z
      .string()
      .email("Invalid email address"),

    password: z
      .string()
      .min(8, "Minimum 8 characters")
      .regex(/[A-Z]/, "One uppercase required")
      .regex(/[a-z]/, "One lowercase required")
      .regex(/[0-9]/, "One number required")
      .regex(
        /[^A-Za-z0-9]/,
        "One special character required"
      ),

    confirmPassword: z.string()
  })
  .refine(
    (data) =>
      data.password === data.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"]
    }
  );

type RegisterForm = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();

  const [loading, setLoading] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword
  ] = useState(false);

  const [openSnackbar, setOpenSnackbar] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [severity, setSeverity] =
    useState<"success" | "error">(
      "success"
    );

  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    formState: {
      errors,
      isValid
    }
  } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    mode: "onChange"
  });

  const password = watch("password", "");

  const strength = () => {
    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password))
      score++;

    return score;
  };

  const onSubmit = async (
    data: RegisterForm
  ) => {
    try {
      setLoading(true);
      clearErrors("email");

      await authApi.post(
        "/register",
        {
          username: data.username,
          email: data.email,
          password: data.password
        }
      );

      setMessage(
        "Registration Successful"
      );

      setSeverity("success");
      setOpenSnackbar(true);

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (error) {
      let errorMessage =
        "Registration Failed";

      if (axios.isAxiosError(error)) {
        const responseData =
          error.response?.data;

        errorMessage =
          responseData?.message ||
          responseData?.detail ||
          (typeof responseData === "string"
            ? responseData
            : null) ||
          errorMessage;
      }

      if (
        errorMessage
          .toLowerCase()
          .includes("email already exists")
      ) {
        setError("email", {
          type: "server",
          message: errorMessage
        });
      }

      setMessage(errorMessage);

      setSeverity("error");
      setOpenSnackbar(true);

    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f1f3f6",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: 3
      }}
    >
      <Paper
        elevation={4}
        sx={{
          width: 950,
          minHeight: 620,
          display: "flex",
          overflow: "hidden"
        }}
      >

        {/* LEFT PANEL */}

        <Box
          sx={{
            width: "35%",
            bgcolor: "#2874f0",
            color: "white",
            p: 5,
            display: "flex",
            flexDirection: "column",
            justifyContent:
              "space-between"
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: "bold" }}
            >
              Looks like
              you're new here!
            </Typography>

            <Typography
              sx={{
                mt: 3,
                fontSize: 20
              }}
            >
              Sign up with your
              email to get started
            </Typography>
          </Box>

          <img
            src="https://static-assets-web.flixcart.com/www/linchpin/fk-cp-zion/img/login_img_c6a81e.png"
            alt="register"
            width="250"
          />
        </Box>

        {/* RIGHT PANEL */}

        <Box
          sx={{
            width: "65%",
            p: 5
          }}
        >
          <form
            onSubmit={handleSubmit(
              onSubmit
            )}
          >

            <TextField
              fullWidth
              margin="normal"
              label="Username"
              {...register("username")}
              error={!!errors.username}
              helperText={
                errors.username?.message
              }
            />

            <TextField
              fullWidth
              margin="normal"
              label="Email"
              {...register("email")}
              error={!!errors.email}
              helperText={
                errors.email?.message
              }
            />

            <TextField
              fullWidth
              margin="normal"
              label="Password"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              {...register("password")}
              error={!!errors.password}
              helperText={
                errors.password?.message
              }
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          setShowPassword(
                            !showPassword
                          )
                        }
                      >
                        {showPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />

            <LinearProgress
              variant="determinate"
              value={strength() * 20}
              sx={{ mt: 2 }}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Confirm Password"
              type={
                showConfirmPassword
                  ? "text"
                  : "password"
              }
              {...register(
                "confirmPassword"
              )}
              error={
                !!errors.confirmPassword
              }
              helperText={
                errors.confirmPassword
                  ?.message
              }
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          setShowConfirmPassword(
                            !showConfirmPassword
                          )
                        }
                      >
                        {showConfirmPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={
                !isValid ||
                loading
              }
              sx={{
                mt: 4,
                bgcolor:
                  "#fb641b",
                py: 1.5
              }}
            >
              {loading ? (
                <CircularProgress
                  size={24}
                  color="inherit"
                />
              ) : (
                "Create Account"
              )}
            </Button>

            <Box
              sx={{
                textAlign: "center",
                mt: 4
              }}
            >
              <Typography>
                Existing User?{" "}
                <Link to="/login">
                  Login
                </Link>
              </Typography>
            </Box>

          </form>
        </Box>

      </Paper>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={() =>
          setOpenSnackbar(false)
        }
      >
        <Alert
          severity={severity}
          variant="filled"
        >
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
