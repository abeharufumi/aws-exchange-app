import { useLocalSearchParams } from "expo-router";
import { UserDetailScreen as UserDetailScreenImpl } from "../../src/screens/user/UserDetailScreen";

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  return <UserDetailScreenImpl route={{ params: { id: id ?? "" } }} />;
}
