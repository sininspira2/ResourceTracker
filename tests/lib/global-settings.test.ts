import {
  DEFAULT_LOCATION_1_NAME,
  DEFAULT_LOCATION_2_NAME,
  LOCATION_1_NAME_KEY,
  LOCATION_2_NAME_KEY,
  getLocationNames,
} from "@/lib/global-settings";

describe("getLocationNames", () => {
  const makeDb = (rows: { settingKey: string; settingValue: string | null }[]) => ({
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockResolvedValue(rows),
  });

  it("returns the configured names when both settings are present", async () => {
    const db = makeDb([
      { settingKey: LOCATION_1_NAME_KEY, settingValue: "Arrakeen" },
      { settingKey: LOCATION_2_NAME_KEY, settingValue: "Sietch Tabr" },
    ]);
    const names = await getLocationNames(db);
    expect(names).toEqual({
      location1Name: "Arrakeen",
      location2Name: "Sietch Tabr",
    });
  });

  it("falls back to defaults when settings are missing", async () => {
    const db = makeDb([]);
    const names = await getLocationNames(db);
    expect(names).toEqual({
      location1Name: DEFAULT_LOCATION_1_NAME,
      location2Name: DEFAULT_LOCATION_2_NAME,
    });
  });

  it("falls back to defaults when values are null", async () => {
    const db = makeDb([
      { settingKey: LOCATION_1_NAME_KEY, settingValue: null },
      { settingKey: LOCATION_2_NAME_KEY, settingValue: null },
    ]);
    const names = await getLocationNames(db);
    expect(names).toEqual({
      location1Name: DEFAULT_LOCATION_1_NAME,
      location2Name: DEFAULT_LOCATION_2_NAME,
    });
  });

  it("falls back to defaults when values are empty/whitespace strings", async () => {
    const db = makeDb([
      { settingKey: LOCATION_1_NAME_KEY, settingValue: "" },
      { settingKey: LOCATION_2_NAME_KEY, settingValue: "   " },
    ]);
    const names = await getLocationNames(db);
    expect(names).toEqual({
      location1Name: DEFAULT_LOCATION_1_NAME,
      location2Name: DEFAULT_LOCATION_2_NAME,
    });
  });

  it("returns defaults on database error", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const db = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockRejectedValue(new Error("boom")),
    };
    const names = await getLocationNames(db);
    expect(names).toEqual({
      location1Name: DEFAULT_LOCATION_1_NAME,
      location2Name: DEFAULT_LOCATION_2_NAME,
    });
    consoleErrorSpy.mockRestore();
  });
});
