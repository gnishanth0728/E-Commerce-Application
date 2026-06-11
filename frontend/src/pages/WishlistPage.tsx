import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Alert,
  Button,
  Snackbar,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getWishlist, removeFromWishlist } from "../api/wishlistApi";
import { addToCart } from "../api/cartApi";
import DeleteIcon from "@mui/icons-material/Delete";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";

interface WishlistItem {
  id: number;
  productId: number;
  productName: string;
  productPrice: number;
  productImageUrl?: string;
  createdAt: string;
}

const WishlistPage: React.FC = () => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const response = await getWishlist();
      setWishlistItems(response.data || []);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("Please login to view your wishlist");
        navigate("/login");
      } else {
        setError("Failed to load wishlist");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (productId: number) => {
    try {
      await removeFromWishlist(productId);
      await loadWishlist();
      setSnackbar({
        open: true,
        message: "Item removed from wishlist",
        severity: "success",
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: "Failed to remove item",
        severity: "error",
      });
    }
  };

  const handleAddToCart = async (item: WishlistItem) => {
    try {
      await addToCart({
        productId: item.productId,
        productName: item.productName,
        price: item.productPrice,
        quantity: 1,
        imageUrl: item.productImageUrl,
      });
      setSnackbar({
        open: true,
        message: "Item added to cart",
        severity: "success",
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: "Failed to add item to cart",
        severity: "error",
      });
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4">Loading wishlist...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          mb: 3,
          p: 3,
          borderRadius: 4,
          background: "linear-gradient(135deg, #ec4899 0%, #f43f5e 45%, #fb7185 100%)",
          color: "white",
          boxShadow: "0 18px 40px rgba(244, 63, 94, 0.25)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
              My Wishlist ❤️
            </Typography>
            <Typography sx={{ opacity: 0.92 }}>
              Save your favorite items and add them to cart whenever you're ready
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => navigate("/")}
            sx={{
              bgcolor: "white",
              color: "#ec4899",
              fontWeight: 700,
              px: 2.5,
              "&:hover": { bgcolor: "#fce7f3" },
            }}
          >
            Continue Shopping
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {wishlistItems.length === 0 ? (
        <Card
          sx={{
            borderRadius: 4,
            textAlign: "center",
            boxShadow: "0 16px 36px rgba(15, 23, 42, 0.08)",
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Your wishlist is empty
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Add items to your wishlist to save them for later. Heart icon
              appears on all products!
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/")}
              sx={{ bgcolor: "#ec4899" }}
            >
              Start Adding Items
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {wishlistItems.map((item: WishlistItem) => (
            <Grid size={{ xs: 12, md: 3 }} key={item.productId}>
              <Card
                sx={{
                  transition: "0.3s",
                  position: "relative",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  "&:hover": {
                    transform: "translateY(-6px)",
                    boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
                  },
                }}
              >
                <CardMedia
                  component="img"
                  height="220"
                  image={
                    item.productImageUrl ||
                    "https://picsum.photos/300/200"
                  }
                  alt={item.productName}
                />

                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: "bold",
                      mb: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.productName}
                  </Typography>

                  <Typography
                    color="primary"
                    sx={{
                      fontWeight: "bold",
                      mb: 2,
                      fontSize: "1.25rem",
                    }}
                  >
                    ₹{item.productPrice?.toFixed(2)}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Added:{" "}
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      flexDirection: "column",
                    }}
                  >
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<ShoppingCartIcon />}
                      sx={{ bgcolor: "#2874f0" }}
                      onClick={() => handleAddToCart(item)}
                    >
                      Add To Cart
                    </Button>

                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() =>
                        handleRemoveFromWishlist(item.productId)
                      }
                    >
                      Remove
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default WishlistPage;
