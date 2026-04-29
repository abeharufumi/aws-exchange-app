import { useLocalSearchParams } from "expo-router";
import { LiveDetailScreen as LiveDetailScreenImpl } from "../../src/screens/live/LiveDetailScreen";

export default function LiveDetailScreen() {
  const { streamId } = useLocalSearchParams<{ streamId?: string }>();

  return <LiveDetailScreenImpl route={{ params: { streamId: streamId ?? "" } }} />;
}
