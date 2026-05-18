"""
Tool definitions for LLM-driven function calling in TravelGPT.
Defines tools that the LLM can decide to call based on user intent.

Tools:
1. search_tours - Tour search with filters
2. get_tour_details - Get specific tour info
3. get_user_bookings - List user bookings
4. cancel_booking - Cancel a booking
5. web_search_travel - External travel sites search
6. show_tour_cards - Display formatted tour results
7. get_weather - Weather info for destinations
8. get_post_trip_summary - Post-trip summary and loyalty
9. search_knowledge - Knowledge base search (safety, policies, FAQs)
"""
from typing import List

# OpenAI-compatible tool definition format
TOOL_DEFINITIONS: List[dict] = [
    {
        "type": "function",
        "function": {
            "name": "search_tours",
            "description": "Tìm kiếm tour du lịch với các bộ lọc tùy chọn. Gọi khi người dùng muốn xem, tìm kiếm hoặc duyệt danh sách tour du lịch. Luôn gọi tool này TRƯỚC KHI trả lời nếu người dùng hỏi về tour, địa điểm, giá tour, hoặc muốn xem gợi ý du lịch.",
            "parameters": {
                "type": "object",
                "properties": {
                    "destination": {
                        "type": "string",
                        "description": "Tên địa điểm du lịch (VD: 'Phú Quốc', 'Đà Nẵng', 'Nha Trang'). Không bắt buộc."
                    },
                    "region": {
                        "type": "string",
                        "enum": ["NORTH", "CENTRAL", "SOUTH", "INTERNATIONAL"],
                        "description": "Vùng miền: 'NORTH' (Miền Bắc), 'CENTRAL' (Miền Trung), 'SOUTH' (Miền Nam), 'INTERNATIONAL' (Quốc tế). Không bắt buộc."
                    },
                    "max_price": {
                        "type": "number",
                        "description": "Giá tối đa mỗi người (VND). VD: 8000000 cho 8 triệu. Không bắt buộc."
                    },
                    "min_price": {
                        "type": "number",
                        "description": "Giá tối thiểu mỗi người (VND). Không bắt buộc."
                    },
                    "duration": {
                        "type": "string",
                        "description": "Thời gian tour (VD: '3 ngày 2 đêm', '5 ngày 4 đêm'). Không bắt buộc."
                    },
                    "category": {
                        "type": "string",
                        "description": "Loại tour (VD: 'biển', 'núi', 'city tour', 'mạo hiểm'). Không bắt buộc."
                    },
                    "query": {
                        "type": "string",
                        "description": "Từ khóa tìm kiếm tự do (VD: 'tour biển mùa hè', 'du lịch gia đình'). Khi có query, hệ thống sẽ dùng semantic search. Không bắt buộc."
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Số lượng tour tối đa muốn nhận. Mặc định: 5. Tối đa: 20.",
                        "default": 5
                    },
                    "is_featured": {
                        "type": "boolean",
                        "description": "Chỉ trả về tour nổi bật (recommended). Mặc định: false.",
                        "default": False
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_tour_details",
            "description": "Lấy chi tiết một tour cụ thể theo ID hoặc slug. Gọi khi người dùng muốn xem thông tin chi tiết của một tour cụ thể (lịch trình, hình ảnh, điều kiện, v.v.) hoặc sau khi người dùng chọn một tour từ danh sách.",
            "parameters": {
                "type": "object",
                "properties": {
                    "tour_id": {
                        "type": "string",
                        "description": "ID của tour (VD: 'clx123abc'). Cung cấp tour_id hoặc slug, không cần cả hai."
                    },
                    "slug": {
                        "type": "string",
                        "description": "Slug của tour (VD: 'tour-phu-quoc-4n3d'). Cung cấp tour_id hoặc slug, không cần cả hai."
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_user_bookings",
            "description": "Lấy danh sách tất cả booking của người dùng, bao gồm trạng thái, ngày đặt, thông tin tour. Gọi khi người dùng hỏi về 'booking của tôi', 'tour đã đặt', 'lịch sử đặt tour', 'booking của tôi ở đâu'.",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {
                        "type": "string",
                        "description": "ID của người dùng. Nếu là user đã đăng nhập, sử dụng user_id từ session. Nếu là anonymous, trả về thông báo yêu cầu đăng nhập."
                    },
                    "status": {
                        "type": "string",
                        "enum": ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"],
                        "description": "Lọc theo trạng thái booking. Không bắt buộc."
                    }
                },
                "required": ["user_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "cancel_booking",
            "description": "Hủy một booking đã đặt. Gọi khi người dùng muốn hủy tour, yêu cầu hoàn tiền, hoặc nói 'hủy booking', 'không muốn đi nữa'. CHỈ gọi sau khi đã xác minh booking_id và nhận được xác nhận từ người dùng (ít nhất phải có 'đồng ý', 'xác nhận' từ user).",
            "parameters": {
                "type": "object",
                "properties": {
                    "booking_id": {
                        "type": "string",
                        "description": "ID của booking cần hủy. BẮT BUỘC phải xác minh booking này thuộc về user trước khi hủy."
                    },
                    "user_id": {
                        "type": "string",
                        "description": "ID của người dùng để xác minh quyền hủy. BẮT BUỘC."
                    },
                    "reason": {
                        "type": "string",
                        "description": "Lý do hủy booking (VD: 'thay đổi kế hoạch', 'trời mưa', 'bệnh'). Không bắt buộc nhưng nên hỏi user."
                    }
                },
                "required": ["booking_id", "user_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "web_search_travel",
            "description": "Tìm kiếm thông tin du lịch từ các website bên ngoài (Traveloka, Booking.com, Viator). Gọi khi người dùng hỏi về thông tin không có trong database nội bộ — VD: thời tiết, vé máy bay, khách sạn, địa điểm ngoài Việt Nam, hoặc khi database nội bộ không có kết quả phù hợp.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Từ khóa tìm kiếm (VD: 'vé máy bay Hà Nội Đà Nẵng tháng 6', 'khách sạn 5 sao Nha Trang'). BẮT BUỘC.",
                        "required": ["query"]
                    },
                    "location": {
                        "type": "string",
                        "description": "Địa điểm cụ thể để lọc kết quả (VD: 'Phú Quốc', 'Đà Nẵng'). Không bắt buộc."
                    },
                    "site": {
                        "type": "string",
                        "enum": ["traveloka", "booking", "viator", "all"],
                        "description": "Website cụ thể để tìm: 'traveloka' (vé máy bay + khách sạn), 'booking' (khách sạn), 'viator' (tour quốc tế), 'all' (tất cả). Mặc định: 'all'.",
                        "default": "all"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Số kết quả tối đa mỗi site. Mặc định: 5. Tối đa: 10.",
                        "default": 5
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "show_tour_cards",
            "description": "Hiển thị danh sách tour với thông tin chi tiết bao gồm ảnh, giá, đánh giá và các nút hành động. Gọi sau khi đã tìm kiếm tour bằng search_tours. LUÔN gọi sau khi search_tours trả về kết quả để hiển thị cho người dùng.",
            "parameters": {
                "type": "object",
                "properties": {
                    "tours": {
                        "type": "array",
                        "description": "Danh sách tour cần hiển thị. Mỗi tour phải có: id, name, slug, destination, duration, price, images.",
                        "items": {
                            "type": "object",
                            "properties": {
                                "id": {"type": "string", "description": "ID của tour"},
                                "name": {"type": "string", "description": "Tên tour"},
                                "slug": {"type": "string", "description": "URL slug của tour"},
                                "destination": {"type": "string", "description": "Điểm đến"},
                                "duration": {"type": "string", "description": "Thời gian tour (VD: '3 ngày 2 đêm')"},
                                "price": {"type": "number", "description": "Giá gốc (VND)"},
                                "discount_price": {"type": "number", "description": "Giá sau giảm (VND)"},
                                "image": {"type": "string", "description": "URL ảnh tour đầu tiên"},
                                "rating": {"type": "number", "description": "Điểm đánh giá (0-5)"},
                                "review_count": {"type": "number", "description": "Số lượng đánh giá"},
                                "short_description": {"type": "string", "description": "Mô tả ngắn"},
                                "is_featured": {"type": "boolean", "description": "Tour nổi bật"},
                                "category": {"type": "string", "description": "Loại tour"},
                                "highlights": {"type": "array", "items": {"type": "string"}, "description": "Điểm nổi bật"}
                            },
                            "required": ["id", "name", "slug", "destination"]
                        }
                    },
                    "message": {
                        "type": "string",
                        "description": "Câu giới thiệu ngắn cho danh sách tour (VD: 'Mình tìm được 5 tour phù hợp cho bạn!')."
                    }
                },
                "required": ["tours", "message"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Lấy thông tin thời tiết hiện tại và dự báo cho một điểm đến du lịch cụ thể. Gọi khi người dùng hỏi về thời tiết, nên mang gì, thời điểm tốt nhất để đi.",
            "parameters": {
                "type": "object",
                "properties": {
                    "destination": {
                        "type": "string",
                        "description": "Tên thành phố hoặc điểm đến (VD: 'Đà Nẵng', 'Hà Nội', 'Phú Quốc'). BẮT BUỘC."
                    },
                    "date": {
                        "type": "string",
                        "description": "Ngày dự kiến đi (YYYY-MM-DD). Không bắt buộc nhưng giúp đưa ra lời khuyên chính xác hơn."
                    }
                },
                "required": ["destination"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_post_trip_summary",
            "description": "Lấy tổng hợp thông tin sau chuyến đi: điểm tích lũy loyalty, khảo sát trải nghiệm, nhắc nhở review. Gọi khi người dùng hoàn thành chuyến đi, hỏi về điểm tích lũy, loyalty, quà tặng sau chuyến đi, hoặc sau khi booking được xác nhận thành công.",
            "parameters": {
                "type": "object",
                "properties": {
                    "booking_code": {
                        "type": "string",
                        "description": "Mã booking (VD: 'BK1A2B3C4'). Nếu không có, hệ thống sẽ dùng booking gần nhất của user."
                    },
                    "tour_name": {
                        "type": "string",
                        "description": "Tên tour (VD: 'Tour Đà Nẵng 3N2Đ'). Không bắt buộc nếu có booking_code."
                    },
                    "destination": {
                        "type": "string",
                        "description": "Điểm đến (VD: 'Đà Nẵng'). Không bắt buộc nếu có booking_code."
                    },
                    "departure_date": {
                        "type": "string",
                        "description": "Ngày khởi hành (YYYY-MM-DD). Không bắt buộc nếu có booking_code."
                    },
                    "return_date": {
                        "type": "string",
                        "description": "Ngày về (YYYY-MM-DD). Không bắt buộc nếu có booking_code."
                    },
                    "num_adults": {
                        "type": "integer",
                        "description": "Số người lớn. Mặc định: 1."
                    },
                    "num_children": {
                        "type": "integer",
                        "description": "Số trẻ em. Mặc định: 0."
                    },
                    "total_spent": {
                        "type": "number",
                        "description": "Tổng chi tiêu chuyến đi (VND). Không bắt buộc nếu có booking_code."
                    },
                    "is_first_booking": {
                        "type": "boolean",
                        "description": "Đây có phải booking đầu tiên không. Mặc định: false."
                    }
                },
                "required": []
            }
        }
    },
    # ============================================
    # KNOWLEDGE SEARCH TOOL
    # ============================================
    {
        "type": "function",
        "function": {
            "name": "search_knowledge",
            "description": """Tìm kiếm cơ sở kiến thức về an toàn, chính sách, FAQ, mẹo du lịch, visa.

Gọi KHI NGƯỜI DÙNG hỏi về:
- An toàn ("có an toàn không", "cẩn thận gì", "cảnh báo")
- Chính sách ("chính sách", "hủy tour", "hoàn tiền")
- Lời khuyên ("nên làm gì", "mẹo", "tips")
- Visa ("visa", "hộ chiếu", "nhập cảnh")
- Câu hỏi thường gặp ("câu hỏi", "faq")
- Hướng dẫn đóng gói ("mang gì", "đóng gói")""",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Câu hỏi bằng ngôn ngữ tự nhiên. VD: 'cẩn thận gì khi tắm biển Phú Quốc'"
                    },
                    "kb_type": {
                        "type": "string",
                        "enum": ["all", "safety", "faq", "travel", "policy", "visa"],
                        "description": "Loại kiến thức: 'all', 'safety', 'faq', 'travel', 'policy', 'visa'",
                        "default": "all"
                    },
                    "destination": {
                        "type": "string",
                        "description": "Lọc theo điểm đến. VD: 'Đà Nẵng'"
                    },
                    "top_k": {
                        "type": "integer",
                        "description": "Số kết quả",
                        "default": 3
                    }
                },
                "required": ["query"]
            }
        }
    }
]


def get_tool_by_name(name: str) -> dict | None:
    """Get a tool definition by name."""
    for tool in TOOL_DEFINITIONS:
        if tool["function"]["name"] == name:
            return tool
    return None
