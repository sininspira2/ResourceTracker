export const useSession = jest.fn().mockReturnValue({
  data: {
    user: {
      name: "Test User",
      email: "test@example.com",
      image: "https://example.com/avatar.png",
      roles: [],
      permissions: {
        hasResourceAccess: true,
        hasTargetEditAccess: true,
        hasResourceAdminAccess: true,
      },
    },
    expires: "1",
  },
  status: "authenticated",
});
