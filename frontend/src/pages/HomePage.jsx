import { useEffect } from "react";
import CategoryItem from "../components/CategoryItem";
import FeaturedProducts from "../components/FeaturedProducts";
import { useProductStore } from "../store/useProductStore";
const categories = [
  { href: "/jeans", name: "Jeans", imageUrl: "/jeans.avif" },
  { href: "/t-shirts", name: "T-shirts", imageUrl: "/tshirts.avif" },
  { href: "/shoes", name: "Shoes", imageUrl: "/shoes.avif" },
  { href: "/glasses", name: "Glasses", imageUrl: "/glasses.avif" },
  { href: "/jackets", name: "Jackets", imageUrl: "/jackets.avif" },
  { href: "/suits", name: "Suits", imageUrl: "/suits.webp" },
  { href: "/bags", name: "Bags", imageUrl: "/bags.webp" },
  { href: "/watches", name: "Watches", imageUrl: "/watches.avif" },
  { href: "/hats", name: "Hats", imageUrl: "/hats.avif" },
];

function HomePage() {
  const { fetchFeaturedProducts, isLoading, products } = useProductStore();
  useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);
  return (
    <div className="relative min-h-screen text-white overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-center text-5xl sm:text-6xl font-bold text-emerald-400 mb-4">
          Explore Our Categories
        </h1>
        <p className="text-center text-xl text-gray-300 mb-12">
          Discover the latest trends in eco-friendly fashion
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <CategoryItem category={category} key={category.name} />
          ))}
        </div>

        {!isLoading && products.length > 0 && (
          <FeaturedProducts featuredProducts={products} />
        )}
      </div>
    </div>
  );
}

export default HomePage;
