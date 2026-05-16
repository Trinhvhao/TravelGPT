"""
Tool definitions for LLM-driven function calling in TravelGPT.
Defines 5 tools that the LLM can decide to call based on user intent.
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
    }
]


def get_tool_by_name(name: str) -> dict | None:
    """Get a tool definition by name."""
    for tool in TOOL_DEFINITIONS:
        if tool["function"]["name"] == name:
            return tool
    return None
