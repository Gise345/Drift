import { Stack } from "expo-router";

export default function CarpoolLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // hide default headings
        animation: "slide_from_right",
      }}
    />
  );
}
