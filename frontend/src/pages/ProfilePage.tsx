import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { getProfile, updateProfile, type ProfileResponse } from "../api/profileApi";

const emptyForm = {
  currentPassword: "",
  newEmail: "",
  newPassword: "",
  confirmPassword: "",
};

export default function ProfilePage() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    void loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await getProfile();
      setProfile(response.data);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }
      setError(err.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const hasNewEmail = form.newEmail.trim().length > 0;
    const hasNewPassword = form.newPassword.trim().length > 0;

    if (!hasNewEmail && !hasNewPassword) {
      setError("Enter a new email or a new password to update your profile");
      return;
    }

    if (hasNewPassword && form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await updateProfile({
        currentPassword: form.currentPassword,
        newEmail: hasNewEmail ? form.newEmail.trim() : undefined,
        newPassword: hasNewPassword ? form.newPassword : undefined,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("username", response.data.username);
      localStorage.setItem("email", response.data.email);

      setProfile((previous) =>
        previous
          ? {
              ...previous,
              username: response.data.username,
              email: response.data.email,
            }
          : previous
      );

      setSuccess("Profile updated successfully");
      setForm(emptyForm);
    } catch (err: any) {
      const responseData = err.response?.data;
      const backendMessage =
        responseData?.message ||
        (typeof responseData === "string" ? responseData : null) ||
        "Failed to update profile";
      setError(backendMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            Loading profile...
          </Typography>
          <LinearProgress />
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f3f7fb", py: 4 }}>
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            border: "1px solid #dbe7f5",
            boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)",
          }}
        >
          <Box
            sx={{
              p: 3,
              color: "white",
              background: "linear-gradient(135deg, #0f172a 0%, #2874f0 55%, #60a5fa 100%)",
            }}
          >
            <Typography variant="overline" sx={{ letterSpacing: 2, opacity: 0.85 }}>
              Account Center
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
              My Profile
            </Typography>
            <Typography sx={{ maxWidth: 640, opacity: 0.9 }}>
              Update your email or password from one place. If you change your email, the session token is refreshed automatically.
            </Typography>
          </Box>

          <CardContent sx={{ p: 3 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {profile && (
              <Grid container spacing={3} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card sx={{ borderRadius: 3, bgcolor: "#f8fbff", height: "100%" }}>
                    <CardContent sx={{ textAlign: "center" }}>
                      <Avatar
                        sx={{
                          width: 72,
                          height: 72,
                          mx: "auto",
                          mb: 2,
                          bgcolor: "#2874f0",
                          fontSize: 30,
                          fontWeight: 800,
                        }}
                      >
                        {profile.username?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {profile.username}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {profile.email}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ justifyContent: "center", flexWrap: "wrap" }}>
                        <Chip label={profile.role} color="primary" />
                        <Chip label="Verified Account" variant="outlined" />
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                  <Card sx={{ borderRadius: 3, bgcolor: "#ffffff" }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                        Update Credentials
                      </Typography>

                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            fullWidth
                            label="Current Password"
                            type="password"
                            value={form.currentPassword}
                            onChange={(event) =>
                              setForm({ ...form, currentPassword: event.target.value })
                            }
                            helperText="Required to update email or password"
                          />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                          <TextField
                            fullWidth
                            label="New Email"
                            value={form.newEmail}
                            onChange={(event) =>
                              setForm({ ...form, newEmail: event.target.value })
                            }
                            helperText="Leave blank if you only want to change your password"
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label="New Password"
                            type="password"
                            value={form.newPassword}
                            onChange={(event) =>
                              setForm({ ...form, newPassword: event.target.value })
                            }
                            helperText="Minimum 8 characters recommended"
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label="Confirm New Password"
                            type="password"
                            value={form.confirmPassword}
                            onChange={(event) =>
                              setForm({ ...form, confirmPassword: event.target.value })
                            }
                            helperText="Must match the new password"
                          />
                        </Grid>
                      </Grid>

                      <Divider sx={{ my: 3 }} />

                      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <Button
                          variant="contained"
                          onClick={handleSubmit}
                          disabled={saving}
                          sx={{
                            bgcolor: "#2874f0",
                            px: 3,
                            py: 1.3,
                            "&:hover": { bgcolor: "#1c52a8" },
                          }}
                        >
                          {saving ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button variant="outlined" onClick={() => navigate(-1)}>
                          Back
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Paper>
      </Container>

      <Snackbar open={Boolean(success)} autoHideDuration={3500} onClose={() => setSuccess("") }>
        <Alert severity="success" variant="filled" onClose={() => setSuccess("") }>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
}
