import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  InputAdornment,
  IconButton,
  Snackbar,
  Alert
} from "@mui/material";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import authApi from "../api/authApi";

const schema = z.object({
  email: z
    .string()
    .email("Enter valid email"),

  password: z
    .string()
    .min(6, "Password is required")
});

type LoginForm = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();

  const [loading, setLoading] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

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
    formState: {
      errors,
      isValid
    }
  } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    mode: "onChange"
  });

  const onSubmit = async (
    data: LoginForm
  ) => {
    try {
      setLoading(true);

      const response =
        await authApi.post(
          "/login",
          data
        );

      localStorage.setItem(
        "token",
        response.data.token
      );

      localStorage.setItem(
        "username",
      response.data.username
      );

    localStorage.setItem(
      "email",
      response.data.email
    );
      setMessage(
        "Login Successful"
      );

      setSeverity("success");
      setOpenSnackbar(true);

      navigate("/");
    } catch (error) {
      setMessage(
        "Invalid Credentials"
      );

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
          width: 900,
          height: 520,
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
              Login
            </Typography>

            <Typography
              sx={{
                mt: 3,
                fontSize: 20
              }}
            >
              Get access to your
              Orders,
              Wishlist and
              Recommendations
            </Typography>
          </Box>

          <img
            src="https://static-assets-web.flixcart.com/www/linchpin/fk-cp-zion/img/login_img_c6a81e.png"
            alt="login"
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
              label="Email"
              margin="normal"
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
              {...register(
                "password"
              )}
              error={
                !!errors.password
              }
              helperText={
                errors.password
                  ?.message
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

            <Typography
              variant="body2"
              sx={{
                mt: 2,
                color: "gray"
              }}
            >
              By continuing,
              you agree to
              ShopEase Terms
              and Conditions.
            </Typography>

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
                "Login"
              )}
            </Button>

            <Box
              sx={{
                textAlign: "center",
                mt: 4
              }}
            >
              <Typography>
                New User?{" "}
                <Link
                  to="/register"
                >
                  Create Account
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