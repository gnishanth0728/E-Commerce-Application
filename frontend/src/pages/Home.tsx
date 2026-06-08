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
  IconButton
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

import {
  useState,
  useEffect,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent
} from "react";
import productApi from "../api/productApi";
import { Link } from "react-router-dom";


export default function Home() {

  const token = localStorage.getItem("token");

  const username =
    localStorage.getItem("username");

  const [anchorEl, setAnchorEl] =
    useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("email");

    window.location.href = "/";
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

useEffect(() => {

  loadCategories();

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
                <MenuItem>
                  My Profile
                </MenuItem>

                <MenuItem>
                  Orders
                </MenuItem>

                <MenuItem>
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

      {/* HERO BANNER - BIG BILLION SALE */}

      <Box
        sx={{
          background: "linear-gradient(135deg, #2874f0 0%, #fb641b 50%, #ff6b6b 100%)",
          color: "white",
          p: 6,
          m: 3,
          borderRadius: 2,
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
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
              textShadow: "2px 2px 4px rgba(0,0,0,0.3)"
            }}
          >
            🎉 Big Billion Sale 🎉
          </Typography>

          <Typography
            variant="h4"
            sx={{
              mb: 2,
              fontWeight: "bold",
              color: "#fff3cd"
            }}
          >
            UP TO 70% OFF
          </Typography>

          <Grid
            container
            spacing={2}
            sx={{
              my: 3,
              justifyContent: "center"
            }}
          >
            <Grid size={{ xs: 6, md: 3 }}>
              <Paper sx={{ p: 2, bgcolor: "rgba(255,255,255,0.9)" }}>
                <Typography sx={{ color: "#fb641b", fontWeight: "bold" }}>
                  Electronics
                </Typography>
                <Typography sx={{ color: "#2874f0", fontSize: 18, fontWeight: "bold" }}>
                  50% OFF
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 6, md: 3 }}>
              <Paper sx={{ p: 2, bgcolor: "rgba(255,255,255,0.9)" }}>
                <Typography sx={{ color: "#fb641b", fontWeight: "bold" }}>
                  Fashion
                </Typography>
                <Typography sx={{ color: "#2874f0", fontSize: 18, fontWeight: "bold" }}>
                  40% OFF
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 6, md: 3 }}>
              <Paper sx={{ p: 2, bgcolor: "rgba(255,255,255,0.9)" }}>
                <Typography sx={{ color: "#fb641b", fontWeight: "bold" }}>
                  Home
                </Typography>
                <Typography sx={{ color: "#2874f0", fontSize: 18, fontWeight: "bold" }}>
                  45% OFF
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 6, md: 3 }}>
              <Paper sx={{ p: 2, bgcolor: "rgba(255,255,255,0.9)" }}>
                <Typography sx={{ color: "#fb641b", fontWeight: "bold" }}>
                  Sports
                </Typography>
                <Typography sx={{ color: "#2874f0", fontSize: 18, fontWeight: "bold" }}>
                  60% OFF
                </Typography>
              </Paper>
            </Grid>
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

    </Box>
  );
}
