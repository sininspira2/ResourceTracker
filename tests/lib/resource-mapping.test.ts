import {
  mapCategoryForRead,
  mapHistoryRowForRead,
  mapResourceRowForRead,
  mapTransferDirectionForRead,
} from "@/lib/resource-mapping";

describe("mapCategoryForRead", () => {
  it("translates 'Blueprints' -> 'Gear Blueprints'", () => {
    expect(mapCategoryForRead("Blueprints")).toBe("Gear Blueprints");
  });

  it("leaves other categories untouched", () => {
    expect(mapCategoryForRead("Raw")).toBe("Raw");
    expect(mapCategoryForRead("Gear")).toBe("Gear");
  });

  it("leaves null/undefined untouched", () => {
    expect(mapCategoryForRead(null)).toBeNull();
    expect(mapCategoryForRead(undefined)).toBeUndefined();
  });
});

describe("mapTransferDirectionForRead", () => {
  it("maps legacy directions to the new values", () => {
    expect(mapTransferDirectionForRead("to_hagga")).toBe(
      "transfer_to_location_1",
    );
    expect(mapTransferDirectionForRead("to_deep_desert")).toBe(
      "transfer_to_location_2",
    );
  });

  it("preserves already-migrated directions", () => {
    expect(mapTransferDirectionForRead("transfer_to_location_1")).toBe(
      "transfer_to_location_1",
    );
    expect(mapTransferDirectionForRead("transfer_to_location_2")).toBe(
      "transfer_to_location_2",
    );
  });

  it("leaves null/undefined untouched", () => {
    expect(mapTransferDirectionForRead(null)).toBeNull();
    expect(mapTransferDirectionForRead(undefined)).toBeUndefined();
  });
});

describe("mapResourceRowForRead", () => {
  it("falls back to Hagga/Deep Desert when location columns are null", () => {
    const result = mapResourceRowForRead({
      id: "1",
      quantityHagga: 7,
      quantityDeepDesert: 3,
      quantityLocation1: null,
      quantityLocation2: null,
      category: "Raw",
    });
    expect(result.quantityLocation1).toBe(7);
    expect(result.quantityLocation2).toBe(3);
    expect(result.category).toBe("Raw");
  });

  it("prefers new location columns when present", () => {
    const result = mapResourceRowForRead({
      id: "1",
      quantityHagga: 7,
      quantityDeepDesert: 3,
      quantityLocation1: 100,
      quantityLocation2: 50,
      category: "Blueprints",
    });
    expect(result.quantityLocation1).toBe(100);
    expect(result.quantityLocation2).toBe(50);
    expect(result.category).toBe("Gear Blueprints");
  });

  it("defaults to 0 when both legacy and new columns are missing", () => {
    const result = mapResourceRowForRead({ id: "1", category: null });
    expect(result.quantityLocation1).toBe(0);
    expect(result.quantityLocation2).toBe(0);
  });
});

describe("mapHistoryRowForRead", () => {
  it("falls back to Hagga/Deep Desert quantity columns", () => {
    const result = mapHistoryRowForRead({
      previousQuantityHagga: 10,
      newQuantityHagga: 20,
      changeAmountHagga: 10,
      previousQuantityDeepDesert: 5,
      newQuantityDeepDesert: 5,
      changeAmountDeepDesert: 0,
      transferDirection: "to_hagga",
    });
    expect(result.previousQuantityLocation1).toBe(10);
    expect(result.newQuantityLocation1).toBe(20);
    expect(result.changeAmountLocation1).toBe(10);
    expect(result.previousQuantityLocation2).toBe(5);
    expect(result.newQuantityLocation2).toBe(5);
    expect(result.changeAmountLocation2).toBe(0);
    expect(result.transferDirection).toBe("transfer_to_location_1");
  });

  it("prefers new location columns when present", () => {
    const result = mapHistoryRowForRead({
      previousQuantityHagga: 10,
      newQuantityHagga: 20,
      changeAmountHagga: 10,
      previousQuantityLocation1: 99,
      newQuantityLocation1: 100,
      changeAmountLocation1: 1,
    });
    expect(result.previousQuantityLocation1).toBe(99);
    expect(result.newQuantityLocation1).toBe(100);
    expect(result.changeAmountLocation1).toBe(1);
  });
});
