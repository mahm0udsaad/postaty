/**
 * @jest-environment node
 */
import { generatePoster } from "@/app/actions";
import { generateText, generateImage } from "ai";
import type { PostFormData } from "@/lib/types";

// Mock the AI SDK functions
jest.mock("ai", () => ({
  generateText: jest.fn(),
  generateImage: jest.fn(),
}));

// Mock the gateway
jest.mock("@/lib/ai", () => {
  const mockGateway = jest.fn((model: string) => model);
  mockGateway.imageModel = jest.fn((model: string) => model);

  return {
    gateway: mockGateway,
  };
});

const mockGenerateText = generateText as jest.MockedFunction<typeof generateText>;
const mockGenerateImage = generateImage as jest.MockedFunction<typeof generateImage>;

describe("generatePoster", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRestaurantFormData = (): PostFormData => ({
    category: "restaurant",
    campaignType: "standard",
    restaurantName: "Test Restaurant",
    logo: "data:image/png;base64,test-logo",
    mealImage: "data:image/png;base64,test-meal",
    mealName: "Test Meal",
    newPrice: "25 SAR",
    oldPrice: "40 SAR",
    whatsapp: "+966500000000",
    cta: "اطلب الان",
    formats: ["instagram-square", "facebook-post"],
  });

  it("should generate a prompt using GPT-4o", async () => {
    const formData = createRestaurantFormData();

    mockGenerateText.mockResolvedValue({
      text: "Generated prompt for poster",
      finishReason: "stop",
      usage: { promptTokens: 100, completionTokens: 50 },
      warnings: [],
      request: {} as any,
      response: {} as any,
      rawResponse: {} as any,
      toJsonResponse: jest.fn(),
    });

    mockGenerateImage.mockResolvedValue({
      image: {
        base64: "generated-image-base64",
        uint8Array: new Uint8Array(),
      },
      finishReason: "stop",
      usage: { promptTokens: 100 },
      warnings: [],
      request: {} as any,
      response: {} as any,
      rawResponse: {} as any,
      toJsonResponse: jest.fn(),
    });

    const result = await generatePoster(formData);

    expect(mockGenerateText).toHaveBeenCalledTimes(1);
    expect(result.prompt).toBe("Generated prompt for poster");
    expect(result.businessName).toBe("Test Restaurant");
    expect(result.productName).toBe("Test Meal");
  });

  it("should generate images for all selected formats", async () => {
    const formData = createRestaurantFormData();

    mockGenerateText.mockResolvedValue({
      text: "Generated prompt",
      finishReason: "stop",
      usage: { promptTokens: 100, completionTokens: 50 },
      warnings: [],
      request: {} as any,
      response: {} as any,
      rawResponse: {} as any,
      toJsonResponse: jest.fn(),
    });

    mockGenerateImage.mockResolvedValue({
      image: {
        base64: "generated-image-base64",
        uint8Array: new Uint8Array(),
      },
      finishReason: "stop",
      usage: { promptTokens: 100 },
      warnings: [],
      request: {} as any,
      response: {} as any,
      rawResponse: {} as any,
      toJsonResponse: jest.fn(),
    });

    const result = await generatePoster(formData);

    // Should generate 2 images (instagram-square and facebook-post)
    expect(mockGenerateImage).toHaveBeenCalledTimes(2);
    expect(result.results).toHaveLength(2);
    expect(result.results[0].format).toBe("instagram-square");
    expect(result.results[1].format).toBe("facebook-post");
    expect(result.results[0].status).toBe("complete");
    expect(result.results[1].status).toBe("complete");
  });

  it("should use correct Google Imagen model and settings", async () => {
    const formData = createRestaurantFormData();
    formData.formats = ["instagram-square"];

    mockGenerateText.mockResolvedValue({
      text: "Generated prompt",
      finishReason: "stop",
      usage: { promptTokens: 100, completionTokens: 50 },
      warnings: [],
      request: {} as any,
      response: {} as any,
      rawResponse: {} as any,
      toJsonResponse: jest.fn(),
    });

    mockGenerateImage.mockResolvedValue({
      image: {
        base64: "generated-image-base64",
        uint8Array: new Uint8Array(),
      },
      finishReason: "stop",
      usage: { promptTokens: 100 },
      warnings: [],
      request: {} as any,
      response: {} as any,
      rawResponse: {} as any,
      toJsonResponse: jest.fn(),
    });

    await generatePoster(formData);

    expect(mockGenerateImage).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "google/gemini-2.5-flash-image",
        aspectRatio: "1:1",
      })
    );
  });

  it("should handle image generation errors gracefully", async () => {
    const formData = createRestaurantFormData();

    mockGenerateText.mockResolvedValue({
      text: "Generated prompt",
      finishReason: "stop",
      usage: { promptTokens: 100, completionTokens: 50 },
      warnings: [],
      request: {} as any,
      response: {} as any,
      rawResponse: {} as any,
      toJsonResponse: jest.fn(),
    });

    // First call succeeds, second call fails
    mockGenerateImage
      .mockResolvedValueOnce({
        image: {
          base64: "generated-image-base64",
          uint8Array: new Uint8Array(),
        },
        finishReason: "stop",
        usage: { promptTokens: 100 },
        warnings: [],
        request: {} as any,
        response: {} as any,
        rawResponse: {} as any,
        toJsonResponse: jest.fn(),
      })
      .mockRejectedValueOnce(new Error("API rate limit exceeded"));

    const result = await generatePoster(formData);

    expect(result.results).toHaveLength(2);
    expect(result.results[0].status).toBe("complete");
    expect(result.results[1].status).toBe("error");
    expect(result.results[1].error).toBe("API rate limit exceeded");
  });

  it("should handle supermarket form with multiple product images", async () => {
    const formData: PostFormData = {
      category: "supermarket",
      campaignType: "standard",
      supermarketName: "Test Supermarket",
      logo: "data:image/png;base64,test-logo",
      productImages: [
        "data:image/png;base64,product1",
        "data:image/png;base64,product2",
        "data:image/png;base64,product3",
      ],
      productName: "Test Product",
      newPrice: "10 SAR",
      oldPrice: "15 SAR",
      whatsapp: "+966500000000",
      headline: "عرض الاسبوع",
      cta: "اطلب الان",
      formats: ["instagram-square"],
    };

    mockGenerateText.mockResolvedValue({
      text: "Generated prompt",
      finishReason: "stop",
      usage: { promptTokens: 100, completionTokens: 50 },
      warnings: [],
      request: {} as any,
      response: {} as any,
      rawResponse: {} as any,
      toJsonResponse: jest.fn(),
    });

    mockGenerateImage.mockResolvedValue({
      image: {
        base64: "generated-image-base64",
        uint8Array: new Uint8Array(),
      },
      finishReason: "stop",
      usage: { promptTokens: 100 },
      warnings: [],
      request: {} as any,
      response: {} as any,
      rawResponse: {} as any,
      toJsonResponse: jest.fn(),
    });

    const result = await generatePoster(formData);

    expect(result.businessName).toBe("Test Supermarket");
    expect(result.productName).toBe("Test Product");
    expect(result.results).toHaveLength(1);
  });

  it("should use correct aspect ratios for different formats", async () => {
    const formData = createRestaurantFormData();
    formData.formats = ["instagram-square", "instagram-story", "facebook-post"];

    mockGenerateText.mockResolvedValue({
      text: "Generated prompt",
      finishReason: "stop",
      usage: { promptTokens: 100, completionTokens: 50 },
      warnings: [],
      request: {} as any,
      response: {} as any,
      rawResponse: {} as any,
      toJsonResponse: jest.fn(),
    });

    mockGenerateImage.mockResolvedValue({
      image: {
        base64: "generated-image-base64",
        uint8Array: new Uint8Array(),
      },
      finishReason: "stop",
      usage: { promptTokens: 100 },
      warnings: [],
      request: {} as any,
      response: {} as any,
      rawResponse: {} as any,
      toJsonResponse: jest.fn(),
    });

    await generatePoster(formData);

    expect(mockGenerateImage).toHaveBeenCalledTimes(3);

    // Check aspect ratios
    const calls = mockGenerateImage.mock.calls;
    expect(calls[0][0]).toMatchObject({ aspectRatio: "1:1" }); // instagram-square
    expect(calls[1][0]).toMatchObject({ aspectRatio: "9:16" }); // instagram-story
    expect(calls[2][0]).toMatchObject({ aspectRatio: "4:5" }); // facebook-post
  });
});
