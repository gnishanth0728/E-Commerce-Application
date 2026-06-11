import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Container,
  Paper,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Badge,
  Snackbar,
  Alert
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";

import {
  useState,
  useEffect,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent
} from "react";
import productApi from "../api/productApi";
import { addToCart, getCart } from "../api/cartApi";
import { addToWishlist, getWishlist, removeFromWishlist } from "../api/wishlistApi";
import { Link, useNavigate } from "react-router-dom";


export default function Home() {

  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const username =
    localStorage.getItem("username");

  const [anchorEl, setAnchorEl] =
    useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error"
  });

  const [cartItemCount, setCartItemCount] =
    useState(0);

  const [wishlistItems, setWishlistItems] =
    useState<Set<number>>(new Set());

  const loadCartCount = async () => {
    try {
      const response = await getCart();
      const totalItems = response.data?.totalItems ??
        response.data?.items?.reduce(
          (sum: number, item: any) => sum + (item.quantity || 0),
          0
        ) ?? 0;

      setCartItemCount(totalItems);
    } catch (error) {
      console.error("Error loading cart count:", error);
    }
  };

  const loadWishlistIds = async () => {
    if (!token) {
      setWishlistItems(new Set());
      return;
    }

    try {
      const response = await getWishlist();
      const ids = new Set<number>((response.data || []).map((item: any) => item.productId));
      setWishlistItems(ids);
    } catch {
      setWishlistItems(new Set());
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("email");

    window.location.href = "/";
  };

  const handleAddToCart = async (product: any) => {
    if (!token) {
      setSnackbar({
        open: true,
        message: "Please login to add items to cart",
        severity: "error"
      });
      return;
    }

    try {
      await addToCart({
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: 1,
        imageUrl: product.imageUrl
      });

      setSnackbar({
        open: true,
        message: "Item added to cart",
        severity: "success"
      });

      await loadCartCount();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to add item to cart",
        severity: "error"
      });
    }
  };

  const handleToggleWishlist = async (product: any) => {
    if (!token) {
      setSnackbar({
        open: true,
        message: "Please login to use wishlist",
        severity: "error"
      });
      return;
    }

    try {
      const resolvedProductId = Number(product?.id ?? product?.productId);
      const resolvedProductName = product?.name ?? product?.productName ?? "Product";
      const resolvedProductPrice = Number(product?.price ?? product?.productPrice ?? 0);
      const resolvedImageUrl = product?.imageUrl ?? product?.productImageUrl;

      if (!resolvedProductId || Number.isNaN(resolvedProductId)) {
        setSnackbar({
          open: true,
          message: "Unable to add item to wishlist",
          severity: "error"
        });
        return;
      }

      const isInWishlist = wishlistItems.has(resolvedProductId);
      
      if (isInWishlist) {
        await removeFromWishlist(resolvedProductId);
        setWishlistItems((prev: Set<number>) => {
          const newSet = new Set(prev);
          newSet.delete(resolvedProductId);
          return newSet;
        });
        setSnackbar({
          open: true,
          message: "Removed from wishlist",
          severity: "success"
        });
      } else {
        await addToWishlist({
          productId: resolvedProductId,
          productName: resolvedProductName,
          productPrice: resolvedProductPrice,
          productImageUrl: resolvedImageUrl
        });
        setWishlistItems((prev: Set<number>) => new Set(prev).add(resolvedProductId));
        setSnackbar({
          open: true,
          message: "Added to wishlist",
          severity: "success"
        });
      }
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to update wishlist",
        severity: "error"
      });
    }
  };

  const [categories, setCategories] =
  useState<any[]>([]);

const [products, setProducts] =
  useState<any[]>([]);

const [selectedCategory, setSelectedCategory] =
  useState<number | null>(null);

const [currentPage, setCurrentPage] =
  useState(1);

const ITEMS_PER_PAGE = 12;

const [currentBannerIndex, setCurrentBannerIndex] =
  useState(0);

const banners = [
  {
    title: "🎉 Big Billion Sale 🎉",
    subtitle: "UP TO 70% OFF",
    gradient: "linear-gradient(135deg, #2874f0 0%, #fb641b 50%, #ff6b6b 100%)",
    offers: [
      { category: "Electronics", discount: "50%" },
      { category: "Fashion", discount: "40%" },
      { category: "Home", discount: "45%" },
      { category: "Sports", discount: "60%" }
    ]
  },
  {
    title: "⚡ Flash Sale ⚡",
    subtitle: "LIMITED TIME ONLY",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    offers: [
      { category: "Mobiles", discount: "35%" },
      { category: "Laptops", discount: "25%" },
      { category: "Headphones", discount: "40%" },
      { category: "Cameras", discount: "50%" }
    ]
  },
  {
    title: "🌟 Exclusive Deals 🌟",
    subtitle: "MEMBERS ONLY",
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    offers: [
      { category: "Books", discount: "30%" },
      { category: "Gaming", discount: "55%" },
      { category: "Smart Watches", discount: "45%" },
      { category: "Appliances", discount: "35%" }
    ]
  }
];

useEffect(() => {

  if (!token) {
    setCartItemCount(0);
    return;
  }

  loadCartCount();
  void loadWishlistIds();

}, [token]);

useEffect(() => {

  loadCategories();

  const bannerInterval = setInterval(() => {
    setCurrentBannerIndex(
      (prev: number) => (prev + 1) % banners.length
    );
  }, 5000);

  return () => clearInterval(bannerInterval);

}, []);

const [search, setSearch] =
  useState("");

const loadCategories = async () => {

  try {

    const response =
      await productApi.get(
        "/categories"
      );

    setCategories(
      response.data
    );

  } catch (error) {

    console.error(error);

  }
};

const loadProducts = async (
  categoryId?: number | null,
  keyword?: string
) => {

  try {

    const hasCategory =
      categoryId !== null &&
      categoryId !== undefined;

    const hasKeyword =
      Boolean(keyword?.trim());

    let response;

    if (hasCategory || hasKeyword) {
      response = await productApi.get(
        "/products/filter",
        {
          params: {
            categoryId: hasCategory
              ? categoryId
              : undefined,
            keyword: hasKeyword
              ? keyword
              : undefined
          }
        }
      );
    } else {
      response = await productApi.get(
        "/products"
      );
    }

    console.log("Products loaded:", response.data);

    setProducts(
      response.data
    );

    setCurrentPage(1);

      } catch (error) {

        console.error("Error loading products:", error);

      }
    };

const paginatedProducts = products.slice(
  (currentPage - 1) * ITEMS_PER_PAGE,
  currentPage * ITEMS_PER_PAGE
);

const totalPages = Math.ceil(
  products.length / ITEMS_PER_PAGE
);

    useEffect(() => {

      loadProducts(
        selectedCategory,
        search
      );

    }, [selectedCategory, search]);

  return (
    <Box sx={{ bgcolor: "#f1f3f6" }}>

      {/* HEADER */}

      <AppBar
        position="sticky"
        sx={{
          bgcolor: "#2874f0",
          boxShadow: "none"
        }}
      >
        <Toolbar sx={{ gap: 3 }}>

          <Typography
            variant="h5"
            sx={{ fontWeight: "bold" }}
          >
            ShopEase
          </Typography>

          <TextField
            placeholder="Search products..."
            value={search}
            onChange={(
              e: ChangeEvent<HTMLInputElement>
            ) =>
              setSearch(e.target.value)
            }
            onKeyDown={(
              e: KeyboardEvent<HTMLInputElement>
            ) => {
              if (e.key === "Enter") {
                loadProducts(selectedCategory, search);
              }
            }}
            size="small"
            sx={{
              bgcolor: "white",
              width: 500,
              borderRadius: 1
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#2874f0" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {search && (
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSearch("");
                          setSelectedCategory(null);
                        }}
                        sx={{ mr: 1 }}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => loadProducts(selectedCategory, search)}
                      sx={{ color: "#2874f0" }}
                    >
                      <SearchIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
          />

          <Box sx={{ flexGrow: 1 }} />

          {token ? (
            <>
              <IconButton
                component={Link}
                to="/cart"
                sx={{ color: "white" }}
              >
                <Badge
                  badgeContent={cartItemCount}
                  color="error"
                  showZero
                  max={999}
                  sx={{
                    "& .MuiBadge-badge": {
                      fontWeight: "bold"
                    }
                  }}
                >
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  cursor: "pointer"
                }}
                onClick={(
                  e: MouseEvent<HTMLElement>
                ) =>
                  setAnchorEl(
                    e.currentTarget
                  )
                }
              >
                <Avatar
                  sx={{
                    bgcolor: "#ff9800"
                  }}
                >
                  {username
                    ?.charAt(0)
                    .toUpperCase()}
                </Avatar>

                <Typography
                  sx={{
                    color: "white",
                    fontWeight: "bold"
                  }}
                >
                  {username}
                </Typography>
              </Box>

              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={() =>
                  setAnchorEl(null)
                }
              >
                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    navigate("/profile");
                  }}
                >
                  My Profile
                </MenuItem>

                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    navigate("/orders");
                  }}
                >
                  Orders
                </MenuItem>

                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    navigate("/wishlist");
                  }}
                >
                  Wishlist
                </MenuItem>

                <MenuItem
                  onClick={handleLogout}
                >
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button
                component={Link}
                to="/login"
                variant="contained"
                sx={{
                  bgcolor: "white",
                  color: "#2874f0"
                }}
              >
                Login
              </Button>

              <Button
                component={Link}
                to="/register"
                sx={{
                  color: "white"
                }}
              >
                Register
              </Button>
            </>
          )}

        </Toolbar>
      </AppBar>

      {/* HERO BANNER CAROUSEL */}

      <Box
        sx={{
          background: banners[currentBannerIndex].gradient,
          color: "white",
          p: 6,
          m: 3,
          borderRadius: 2,
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          transition: "all 0.8s ease-in-out",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)",
            pointerEvents: "none"
          }
        }}
      >
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: "bold",
              mb: 1,
              textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
              transition: "all 0.8s ease-in-out"
            }}
          >
            {banners[currentBannerIndex].title}
          </Typography>

          <Typography
            variant="h4"
            sx={{
              mb: 3,
              fontWeight: "bold",
              color: "#fff3cd",
              transition: "all 0.8s ease-in-out"
            }}
          >
            {banners[currentBannerIndex].subtitle}
          </Typography>

          <Grid
            container
            spacing={2}
            sx={{
              my: 3,
              justifyContent: "center"
            }}
          >
            {banners[currentBannerIndex].offers.map((offer) => (
              <Grid size={{ xs: 6, md: 3 }} key={offer.category}>
                <Paper sx={{ p: 2, bgcolor: "rgba(255,255,255,0.9)" }}>
                  <Typography sx={{ color: "#fb641b", fontWeight: "bold" }}>
                    {offer.category}
                  </Typography>
                  <Typography sx={{ color: "#2874f0", fontSize: 18, fontWeight: "bold" }}>
                    {offer.discount} OFF
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Button
            variant="contained"
            sx={{
              bgcolor: "#fff3cd",
              color: "#fb641b",
              fontWeight: "bold",
              fontSize: 16,
              px: 4,
              py: 1.5,
              "&:hover": {
                bgcolor: "#fff",
                transform: "scale(1.05)"
              }
            }}
          >
            SHOP NOW
          </Button>

          {/* BANNER NAVIGATION */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 2,
              mt: 4
            }}
          >
            <IconButton
              size="small"
              onClick={() =>
                setCurrentBannerIndex(
                  (prev: number) =>
                    (prev - 1 + banners.length) %
                    banners.length
                )
              }
              sx={{ color: "white" }}
            >
              ❮
            </IconButton>

            <Box sx={{ display: "flex", gap: 1 }}>
              {banners.map((_, index) => (
                <Box
                  key={index}
                  onClick={() =>
                    setCurrentBannerIndex(index)
                  }
                  sx={{
                    width: currentBannerIndex === index ? 12 : 8,
                    height: 8,
                    bgcolor:
                      currentBannerIndex === index
                        ? "white"
                        : "rgba(255,255,255,0.5)",
                    borderRadius: "50%",
                    cursor: "pointer",
                    transition: "all 0.3s ease"
                  }}
                />
              ))}
            </Box>

            <IconButton
              size="small"
              onClick={() =>
                setCurrentBannerIndex(
                  (prev: number) => (prev + 1) % banners.length
                )
              }
              sx={{ color: "white" }}
            >
              ❯
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* CATEGORIES */}

      <Container>
        <Typography
          variant="h5"
          sx={{
            fontWeight: "bold",
            mb: 3
          }}
        >
          Categories
        </Typography>

        <Grid container spacing={2}>
        {categories.map((category: any) => (

  <Grid
    size={{
      xs: 6,
      md: 2
    }}
    key={category.id}
  >
    <Paper
      onClick={() => {

        setSelectedCategory(
          category.id
        );

      }}
      sx={{
        p: 3,
        textAlign: "center",
        cursor: "pointer",
        bgcolor:
          selectedCategory ===
          category.id
            ? "#2874f0"
            : "white",
        color:
          selectedCategory ===
          category.id
            ? "white"
            : "black"
      }}
    >
      {category.name}
    </Paper>
  </Grid>

))}
        </Grid>
      </Container>

      {/* SEARCH RESULTS / PRODUCTS SECTION */}

      <Box
        sx={{
          mt: 5,
          py: 4,
          bgcolor: search ? "#e3f2fd" : "#f1f3f6",
          transition: "background-color 0.3s ease"
        }}
      >
        <Container>
          <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography
                variant="h5"
                sx={{ fontWeight: "bold" }}
              >
                {search ? `Search Results for "${search}"` : selectedCategory ? "Category Products" : "Featured Products"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Found {products.length} product{products.length !== 1 ? "s" : ""}
              </Typography>
            </Box>
            {(search || selectedCategory) && (
              <Button
                variant="outlined"
                color="primary"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory(null);
                }}
              >
                Clear Filters
              </Button>
            )}
          </Box>

          {products.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography variant="h6" color="text.secondary">
                No products found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Try adjusting your search or filters
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {paginatedProducts.map((product: any) => (
                <Grid
                  size={{
                    xs: 12,
                    md: 3
                  }}
                  key={product.id}
                >
                  <Card
                    sx={{
                      transition: "0.3s",
                      position: "relative",
                      "&:hover": {
                        transform:
                          "translateY(-6px)",
                        boxShadow: "0 8px 16px rgba(0,0,0,0.2)"
                      }
                    }}
                  >
                    {/* WISHLIST BUTTON */}
                    <IconButton
                      onClick={() => handleToggleWishlist(product)}
                      sx={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        bgcolor: "rgba(255, 255, 255, 0.9)",
                        "&:hover": {
                          bgcolor: "rgba(255, 255, 255, 1)"
                        },
                        zIndex: 2,
                        width: 40,
                        height: 40,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      {wishlistItems.has(product.id) ? (
                        <FavoriteIcon sx={{ color: "#ff5252" }} />
                      ) : (
                        <FavoriteBorderIcon sx={{ color: "#999" }} />
                      )}
                    </IconButton>

                    {/* DISCOUNT BADGE */}
                    <Box
                      sx={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        bgcolor: "#ff5252",
                        color: "white",
                        borderRadius: "50%",
                        width: 50,
                        height: 50,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontSize: 12,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                        zIndex: 1
                      }}
                    >
                      {Math.floor(Math.random() * (60 - 15 + 1)) + 15}% OFF
                    </Box>

                    <CardMedia
                      component="img"
                      height="220"
                      image={
                        product.imageUrl ||
                        "https://picsum.photos/300/200"
                      }
                    />

                    <CardContent>

                      <Typography
                        variant="h6"
                        sx={{ fontWeight: "bold" }}
                      >
                        {product.name}
                      </Typography>

                      <Typography
                        color="primary"
                        sx={{
                          fontWeight: "bold",
                          mt: 1
                        }}
                      >
                        ₹{product.price}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1, mb: 2 }}
                      >
                        {product.description}
                      </Typography>

                      <Button
                        fullWidth
                        variant="contained"
                        sx={{ mt: 1, bgcolor: "#2874f0" }}
                        onClick={() => handleAddToCart(product)}
                      >
                        Add To Cart
                      </Button>

                    </CardContent>

                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {products.length > ITEMS_PER_PAGE && (
            <Box
              sx={{
                mt: 4,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 2
              }}
            >
              <Button
                variant="contained"
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage(currentPage - 1)
                }
              >
                Previous
              </Button>

              <Typography>
                Page {currentPage} of {totalPages}
              </Typography>

              <Button
                variant="contained"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage(currentPage + 1)
                }
              >
                Next
              </Button>
            </Box>
          )}
        </Container>
      </Box>

      {/* FOOTER */}

      <Box
        sx={{
          mt: 8,
          bgcolor: "#172337",
          color: "white",
          p: 5
        }}
      >
        <Container>
          <Typography variant="h6">
            ShopEase
          </Typography>

          <Typography>
            Modern E-Commerce Platform
          </Typography>
        </Container>
      </Box>

      {/* SNACKBAR NOTIFICATION */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() =>
          setSnackbar({ ...snackbar, open: false })
        }
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() =>
            setSnackbar({ ...snackbar, open: false })
          }
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Box>
  );
}
