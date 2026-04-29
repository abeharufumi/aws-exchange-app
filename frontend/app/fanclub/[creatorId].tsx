import { useLocalSearchParams } from "expo-router";
import { FanclubCreatorScreen as FanclubCreatorScreenImpl } from "../../src/screens/fanclub/FanclubScreen";

export default function FanclubCreatorScreen() {
  const { creatorId } = useLocalSearchParams<{ creatorId?: string }>();

  return <FanclubCreatorScreenImpl creatorId={Number(creatorId || 0)} />;
}
