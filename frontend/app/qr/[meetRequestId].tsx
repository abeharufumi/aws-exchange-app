import { useLocalSearchParams } from "expo-router";
import { QRScreen as QRScreenImpl } from "../../src/screens/qr/QRScreen";

export default function QRScreen() {
  const { meetRequestId } = useLocalSearchParams<{ meetRequestId?: string }>();

  return <QRScreenImpl route={{ params: { meetRequestId: meetRequestId ?? "" } }} />;
}
