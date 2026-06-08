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

      } catch (error) {

        console.error("Error loading products:", error);

      }
    };

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

      {/* HERO BANNER */}

      <Paper
        sx={{
          m: 3,
          height: 350,
          borderRadius: 2,
          background:
            "linear-gradient(135deg,#2874f0,#4facfe)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white"
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <Typography
            variant="h2"
            sx={{ fontWeight: "bold" }}
          >
            Big Billion Sale
          </Typography>

          <Typography variant="h5">
            Up to 70% OFF
          </Typography>

          <Button
            variant="contained"
            color="warning"
            sx={{ mt: 3 }}
          >
            Shop Now
          </Button>
        </Box>
      </Paper>

      {/* CATEGORIES */}

      <Container>
        <Typography
          variant="h5"
          sx={{ fontWeight: "bold" }}
          mb={3}
        >
          Categories
        </Typography>

        <Grid container spacing={2}>
        {categories.map((category: any) => (

  <Grid
    item
    xs={6}
    md={2}
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
              {products.map((product: any) => (
                <Grid
                  item
                  xs={12}
                  md={3}
                  key={product.id}
                >
                  <Card
                    sx={{
                      transition: "0.3s",
                      "&:hover": {
                        transform:
                          "translateY(-6px)",
                        boxShadow: "0 8px 16px rgba(0,0,0,0.2)"
                      }
                    }}
                  >
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
