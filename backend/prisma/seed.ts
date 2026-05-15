import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@travelgpt.vn" },
    update: {},
    create: {
      email: "admin@travelgpt.vn",
      password_hash: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.S0V3GJk3kM7n2y", // password: admin123
      full_name: "Admin TravelGPT",
      role: "ADMIN",
      phone: "0901234567",
    },
  });
  console.log("Created admin:", admin.email);

  // Create test user
  const user = await prisma.user.upsert({
    where: { email: "user@test.com" },
    update: {},
    create: {
      email: "user@test.com",
      password_hash: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.S0V3GJk3kM7n2y", // password: user123
      full_name: "Nguyen Van Test",
      role: "USER",
      phone: "0909876543",
    },
  });
  console.log("Created user:", user.email);

  // Sample Tours
  const tours = [
    {
      name: "Tour Đà Nẵng - Hội An - Bà Nà 3N2Đ",
      slug: "tour-da-nang-hoi-an-ba-na-3n2d",
      description: "Khám phá Đà Nẵng - thành phố đáng sống nhất Việt Nam với các điểm đến hấp dẫn: Bà Nà Hills, phố cổ Hội An, và bãi biển Mỹ Khê.",
      short_description: "Tour trọn gói 3 ngày 2 đêm khám phá Đà Nẵng và Hội An",
      destination: "Đà Nẵng",
      region: "CENTRAL",
      duration: "3 ngày 2 đêm",
      price: 4500000,
      discount_price: 3990000,
      max_participants: 30,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800",
        "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800",
      ]),
      highlights: JSON.stringify([
        "Tham quan Bà Nà Hills - Fantasy Park",
        "Check-in Cầu Vàng huyền thoại",
        "Dạo phố cổ Hội An về đêm",
        "Tắm biển Mỹ Khê",
        "Ngắm sông Hàn về đêm",
      ]),
      includes: JSON.stringify([
        "Xe máy lạnh đưa đón",
        "Khách sạn 3 sao",
        "Ăn sáng hàng ngày",
        "Vé tham quan các điểm đến",
        "Hướng dẫn viên tiếng Việt",
      ]),
      excludes: JSON.stringify([
        "Vé máy bay",
        "Ăn trưa và ăn tối",
        "Chi phí cá nhân",
        "Bảo hiểm du lịch",
      ]),
      is_featured: true,
      category: "cultural",
      tags: JSON.stringify(["Đà Nẵng", "Hội An", "Bà Nà", "Biển"]),
    },
    {
      name: "Tour Phú Quốc 4N3Đ - Đảo Ngọc Thiên Đường",
      slug: "tour-phu-quoc-4n3d",
      description: "Trải nghiệm thiên đường biển đảo Phú Quốc với những bãi biển đẹp nhất Việt Nam.",
      short_description: "Tour 4 ngày 3 đêm khám phá đảo ngọc Phú Quốc",
      destination: "Phú Quốc",
      region: "SOUTH",
      duration: "4 ngày 3 đêm",
      price: 6500000,
      discount_price: 5990000,
      max_participants: 25,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1612731487417-8d1c2f7c3c66?w=800",
      ]),
      highlights: JSON.stringify([
        "Vinpearl Safari - Vườn thú mở đầu tiên",
        "Grand World - Phố đêm mua sắm",
        "Bãi Sao - Bãi biển đẹp nhất đảo",
        "Cáp treo Hòn Thơm",
      ]),
      includes: JSON.stringify([
        "Vé máy bay khứ hồi",
        "Khách sạn 4 sao",
        "Ăn sáng",
        "Di chuyển đảo",
      ]),
      excludes: JSON.stringify([
        "Ăn trưa, ăn tối",
        "Chi phí giải trí",
      ]),
      is_featured: true,
      category: "beach",
      tags: JSON.stringify(["Phú Quốc", "Biển", "Đảo", "Vinpearl"]),
    },
    {
      name: "Tour Sapa 2N1Đ - Trekking Fansipan",
      slug: "tour-sapa-2n1d-trekking",
      description: "Hành trình trekking đến Fansipan - nóc nhà Đông Dương, khám phá văn hóa dân tộc H'Mông, Dao.",
      short_description: "Tour 2 ngày 1 đêm trekking Sapa",
      destination: "Sapa",
      region: "NORTH",
      duration: "2 ngày 1 đêm",
      price: 2800000,
      discount_price: null,
      max_participants: 15,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1597007064818-11d2395dc5df?w=800",
      ]),
      highlights: JSON.stringify([
        "Trekking đỉnh Fansipan",
        "Thăm bản Cát Cát",
        "Thác Silver Waterfall",
        "Đèo Ô Quy Hồ",
      ]),
      includes: JSON.stringify([
        "Xe limousine",
        "Khách sạn",
        "Ăn sáng",
        "Vé cáp treo",
      ]),
      excludes: JSON.stringify([
        "Ăn trưa, ăn tối",
        "Chi phí cá nhân",
      ]),
      is_featured: false,
      category: "adventure",
      tags: JSON.stringify(["Sapa", "Fansipan", "Trekking", "Núi"]),
    },
    {
      name: "Tour Nha Trang 3N2Đ - Biển Xanh Cát Trắng",
      slug: "tour-nha-trang-3n2d",
      description: "Khám phá Nha Trang - thiên đường biển với nắng vàng, cát trắng, và những đảo nhỏ xinh đẹp.",
      short_description: "Tour 3 ngày 2 đêm khám phá Nha Trang",
      destination: "Nha Trang",
      region: "CENTRAL",
      duration: "3 ngày 2 đêm",
      price: 3800000,
      discount_price: 3490000,
      max_participants: 30,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1600113260639-5d9bc354a1d4?w=800",
      ]),
      highlights: JSON.stringify([
        "Tham quan Vinpearl Land",
        "Tắm biển Hòn Miễu",
        "Nước khoáng Tháp Bà",
        "Chợ đêm Nha Trang",
      ]),
      includes: JSON.stringify([
        "Xe máy lạnh",
        "Khách sạn 3 sao",
        "Ăn sáng",
        "Vé tham quan",
      ]),
      excludes: JSON.stringify([
        "Vé máy bay",
        "Ăn trưa, ăn tối",
      ]),
      is_featured: true,
      category: "beach",
      tags: JSON.stringify(["Nha Trang", "Biển", "Vinpearl", "Đảo"]),
    },
    {
      name: "Tour Hà Nội - Hạ Long 2N1Đ",
      slug: "tour-ha-noi-ha-long-2n1d",
      description: "Khám phá vịnh Hạ Long - kỳ quan thiên nhiên thế giới với hàng ngàn đảo đá và hang động kỳ bí.",
      short_description: "Tour 2 ngày 1 đêm vịnh Hạ Long",
      destination: "Hạ Long",
      region: "NORTH",
      duration: "2 ngày 1 đêm",
      price: 2200000,
      discount_price: null,
      max_participants: 35,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1528127269322-539801943592?w=800",
      ]),
      highlights: JSON.stringify([
        "Du thuyền Hạ Long",
        "Hang Sửng Sốt",
        "Đảo Ti Top",
        "Làng chài Vung Viễng",
      ]),
      includes: JSON.stringify([
        "Xe đưa đón",
        "Du thuyền 4 sao",
        "Ăn trưa, chiều, sáng",
        "Vé tham quan",
      ]),
      excludes: JSON.stringify([
        "Vé máy bay",
        "Chi phí cá nhân",
      ]),
      is_featured: false,
      category: "cultural",
      tags: JSON.stringify(["Hạ Long", "Vịnh", "Du thuyền", "Di sản"]),
    },
    {
      name: "Tour Bangkok - Pattaya 4N3Đ",
      slug: "tour-bangkok-pattaya-4n3d",
      description: "Khám phá xứ Chùa Vàng với Bangkok hoa lệ và Pattaya sôi động.",
      short_description: "Tour 4 ngày 3 đêm khám phá Thái Lan",
      destination: "Bangkok",
      region: "INTERNATIONAL",
      duration: "4 ngày 3 đêm",
      price: 8900000,
      discount_price: 7990000,
      max_participants: 25,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800",
      ]),
      highlights: JSON.stringify([
        "Cung điện Hoàng gia",
        "Wat Arun - Chùa Thuyền",
        "Walking Street Pattaya",
        "Đảo Coral",
      ]),
      includes: JSON.stringify([
        "Vé máy bay",
        "Khách sạn 4 sao",
        "Ăn sáng",
        "Di chuyển",
        "Visa Thailand",
      ]),
      excludes: JSON.stringify([
        "Ăn trưa, ăn tối",
        "Bảo hiểm",
        "Chi phí cá nhân",
      ]),
      is_featured: true,
      category: "cultural",
      tags: JSON.stringify(["Bangkok", "Pattaya", "Thái Lan", "Quốc tế"]),
    },
  ];

  for (const tourData of tours) {
    const tour = await prisma.tour.upsert({
      where: { slug: tourData.slug },
      update: tourData,
      create: {
        ...tourData,
        departure_dates: JSON.stringify([
          "2026-05-20",
          "2026-05-25",
          "2026-06-01",
          "2026-06-05",
        ]),
      },
    });
    console.log("Created tour:", tour.name);
  }

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
