import { useLocalSearchParams } from "expo-router";
import { ReviewScreen as ReviewScreenImpl } from "../../src/screens/review/ReviewScreen";

export default function ReviewScreen() {
  const { meetId, chatUserId } = useLocalSearchParams<{ meetId?: string; chatUserId?: string }>();

  return (
    <ReviewScreenImpl route={{ params: { meetId: meetId ?? "", chatUserId: chatUserId ?? "" } }} />
  );
}
