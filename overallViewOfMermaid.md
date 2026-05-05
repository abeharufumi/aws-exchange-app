%%{init: {'theme': 'dark'}}%%
flowchart LR

%% 優先順位凡例
%% 🔴P1-##: フェーズ 1（MVP）- 1-2 ヶ月で必須実装（番号順に実装）
%% 🟠P2-##: フェーズ 2（ユーザー拡大）- 3-4 ヶ月で実装（番号順に実装）
%% 🟡P3-##: フェーズ 3（収益化）- 5-6 ヶ月以降で実装（番号順に実装）
%% ⚪ スキップ: 後回し・オプション

Start["トップ画面 🔴P1-01"] --> Login{"未ログイン? 🔴P1-02"}
Login -->|Yes| Signin["ログイン / サインアップ 🔴P1-03"]
Login -->|No| AppLayout["画面レイアウト 🔴P1-04"]
AppLayout --> TopNav["画面上部: タブナビゲーション 🔴P1-05"]
AppLayout --> BottomNav["画面下部: ナビゲーションバー 🔴P1-06"]

TopNav -->|デフォルト| Timeline["タイムライン (異性ユーザー) 🔴P1-07"]
TopNav -->|スライド式| LiveTab["配信動画タブ 🟡P3-01"]
LiveTab --> LiveStream["配信動画 🟡P3-02"]
LiveStream --> WatchLiveStream["対象者のライブ配信に入室 🟡P3-03"]
WatchLiveStream --> CheckFanclubMember{"入室者がファンクラブ会員? 🟡P3-04"}
CheckFanclubMember -->|Yes| NotifyWithIcon["ライブチャットに『会員アイコン + ●● さんが入室しました』を自動表示 (配信者側) 🟡P3-05"]
CheckFanclubMember -->|No| NotifyWithoutIcon["ライブチャットに『●● さんが入室しました』を自動表示 (配信者側) 🟡P3-06"]
TopNav -->|増加可能| OtherTabs["その他タブ ⚪ スキップ"]

BottomNav --> HomeIcon["ホーム 🔴P1-08"]
BottomNav --> SearchIcon["虫眼鏡アイコン (検索) 🔴P1-09"]
BottomNav --> MyIcon["自分のアイコン 🔴P1-10"]
BottomNav --> BellIcon["鈴アイコン (通知) 🟠P2-01"]

HomeIcon --> Timeline

SearchIcon --> SearchUsers["ユーザー検索 🔴P1-11"]
SearchUsers --> CheckSearchRank{"検索権限確認 🔴P1-12"}
CheckSearchRank -->|"Rank1 通常 / Rank1+Boost"| BasicSearch["基本検索 (地域のみ) 🔴P1-13"]
CheckSearchRank -->|"Rank1 Premium +Boost"| AdvancedSearch["詳細検索 (年齢/ランク/目的/地域) 🟠P2-02"]
CheckSearchRank -->|"Rank2 通常 / Rank2+Boost"| AgeSearch["地域 + 年齢検索 🟠P2-03"]
CheckSearchRank -->|"Rank2 Premium +Boost"| AdvancedSearch
CheckSearchRank -->|"Rank3 以上 全状態"| AdvancedSearch
BasicSearch --> FilteredCards["ヒットしたユーザーカードを表示 🔴P1-14"]
AgeSearch --> FilteredCards
AdvancedSearch --> FilteredCards
FilteredCards --> Card["ユーザーカード 🔴P1-15"]
Card --> Profile["プロフィール閲覧 🔴P1-16"]
Profile --> MatchingReqBtn["マッチングを依頼 🔴P1-17"]
MatchingReqBtn -->|クリック| MatchingPopup["初メッセージ入力ポップアップ 🔴P1-18"]
MatchingPopup -->|送信| SendMatchingReq["マッチング依頼 + 初メッセージ送信 🔴P1-19"]
SendMatchingReq --> MatchingBtn1["ボタンテキスト: 『依頼中』 🔴P1-20"]

MatchingBtn1 -->|相手が承諾| MatchingBtn2["ボタンテキスト: 『マッチング中』 🔴P1-21"]
MatchingBtn2 --> MailIcon["メールアイコン表示 🔴P1-22"]
MailIcon -->|クリック| Chat["チャット画面 🔴P1-23"]

MatchingBtn1 -->|相手が承諾しない または 7 日経過| MatchingBtn1Back["ボタンテキスト戻す: 『マッチングを依頼』 🔴P1-24"]
MatchingBtn1Back --> MatchingReqReceive["相手が鈴アイコンから履歴確認 🟠P2-04"]

Chat --> CheckMsgQuota{"送信上限チェック (1. メッセージ送信数) 🔴P1-25"}
CheckMsgQuota -->|"男性 Rank1 通常"| MsgMen1["上限: 3 通/日 🔴P1-26"]
CheckMsgQuota -->|"男性 Rank1 Boost"| MsgMen1B["上限: 3 通/日 + 追加10通(使い切り) 🟠P2-05"]
CheckMsgQuota -->|"男性 Rank2 通常"| MsgMen2["上限: 5 通/日 🟠P2-06"]
CheckMsgQuota -->|"男性 Rank2 Boost"| MsgMen2B["上限: 5 通/日 + 追加10通(使い切り) 🟠P2-07"]
CheckMsgQuota -->|"男性 Rank3 通常"| MsgMen3["上限: 10 通/日 🟠P2-08"]
CheckMsgQuota -->|"男性 Rank3 Boost"| MsgMen3B["上限: 10 通/日 + 追加10通(使い切り) 🟠P2-09"]
CheckMsgQuota -->|"女性 Rank1 通常"| MsgWomen1["上限: 3 通/日 🔴P1-27"]
CheckMsgQuota -->|"女性 Rank1 Boost"| MsgWomen1B["上限: 3 通/日 + 追加10通(使い切り) 🟠P2-10"]
CheckMsgQuota -->|"女性 Rank2 通常"| MsgWomen2["上限: 10 通/日 🟠P2-11"]
CheckMsgQuota -->|"女性 Rank2 Boost"| MsgWomen2B["上限: 10 通/日 + 追加10通(使い切り) 🟠P2-12"]
CheckMsgQuota -->|"Premium 全 Rank / Rank4-5 全状態 / 女性 Rank3-5 全状態"| MsgUnlimited["上限: 無制限 🟠P2-13"]
MsgMen1 --> QuotaCheck{"本日の送信回数チェック 🔴P1-28"}
MsgMen1B --> QuotaCheck
MsgMen2 --> QuotaCheck
MsgMen2B --> QuotaCheck
MsgMen3 --> QuotaCheck
MsgMen3B --> QuotaCheck
MsgWomen1 --> QuotaCheck
MsgWomen1B --> QuotaCheck
MsgWomen2 --> QuotaCheck
MsgWomen2B --> QuotaCheck
MsgUnlimited --> QuotaCheck
QuotaCheck -->|上限に達している| PopupQuotaExceeded["ポップアップ: 送信回数が上限に達しています 🔴P1-29"]
QuotaCheck -->|送信可能| MsgSend["メッセージ送信 🔴P1-30"]
PopupQuotaExceeded --> UpgradePrompt["プレミアム加入 or ランク昇格案内 🟠P2-14"]
MsgSend --> CountAsReply["返信数カウント +1 🔴P1-31"]
CountAsReply --> UpdateReplyRate["返信率更新: (返信数 / 承諾数) × 100% 🔴P1-32"]

Chat --> ScrollDetect["QR ボタン領域までスクロール検知 🔴P1-33"]
ScrollDetect --> CheckTime{"約束時刻か? 🔴P1-34"}
CheckTime -->|No| QRDisabledFromChat["QR ボタン グレーアウト 🔴P1-35"]
CheckTime -->|Yes| QRActive["QR ボタン 活性化 🔴P1-36"]
CheckTime -->|Yes| Wait30Min["約束時間以降一度でも QR が表示されたか監視 🔴P1-37"]
CheckTime -->|Yes| CameraIconBtn["カメラアイコンボタンが活性化 (A さん側) 🔴P1-38"]

Chat --> BookDateBtn["デートを申し込むボタン 🔴P1-39"]
BookDateBtn -->|クリック| DatePopup["日付入力ポップアップ (右下に送信ボタン) 🔴P1-40"]
DatePopup -->|送信| CreateMeet["約束作成: 日時のみ 🔴P1-41"]
CreateMeet --> APIMeet["POST /meet_requests で request_id 🔴P1-42"]
APIMeet --> ShowInactiveQRBtn["非活性の QR ボタン表示 (デート申し込み側のみ) 🔴P1-43"]
APIMeet --> MeetNotifyA["A さんに約束リクエスト通知 🔴P1-44"]
MeetNotifyA --> MeetAcceptA{"A さんが約束を承諾? 🔴P1-45"}
MeetAcceptA -->|承諾| ShowInactiveCameraA["非活性のカメラアイコン表示 (A さん側) 🔴P1-46"]
MeetAcceptA -->|拒否| NotifyRejectB["B さんに『A さんが約束を却下しました』通知 🔴P1-47"]
NotifyRejectB --> HideInactiveQR["非活性の QR ボタンを非表示 (B さん側) 🔴P1-48"]
ShowInactiveCameraA -->|タップ| CameraInactivePopup["ポップアップ: デート当日 B さんの QR を読み取ってください 🔴P1-49"]
ShowInactiveQRBtn -->|ボタンタップ| QRPopupMsg["ポップアップ: 『当日現場に着いたら押せるようになります。当日読み取ってもらってください』 🔴P1-50"]
QRActive --> QRRequestPos["B さんが QR 要求 (現在地を送信) 🔴P1-51"]
Wait30Min -->|No: 初回| ArrivalPopupFirst["約束時間から 30 分経過しました。相手は現場に到着しそうですか？ 🔴P1-52"]
Wait30Min -->|No: 2 回目以降| ArrivalPopupLoop["さらに 30 分経過しました。相手は現場に到着しそうですか？ 🔴P1-53"]
ArrivalPopupFirst -->|はい| Wait30Min
ArrivalPopupLoop -->|はい| Wait30Min
ArrivalPopupFirst -->|いいえ| TroubleOptions["ポップアップ: どうしましたか？ 🔴P1-54"]
ArrivalPopupLoop -->|いいえ| TroubleOptions
TroubleOptions -->|"予定がキャンセルになりました"| CancelledAgreed["予定キャンセル (合意) 🔴P1-55"]
CancelledAgreed --> QRDisabledCancelled["QR ボタン グレーアウト (キャンセル済み) 🔴P1-56"]
QRDisabledCancelled -->|タップ| QRInvalidPopup["ポップアップ: 無効です。再度デートを申し込んでください 🔴P1-57"]
TroubleOptions -->|"ドタキャンに合いました"| Reported["通報状態 (緊急モード) 🔴P1-58"]
Reported --> NotifyPartner["相手 (A) に「B が通報しました」通知 🔴P1-59"]
QRRequestPos --> WaitAreaCheckResult["A さんのエリア判定結果を待機 🔴P1-60"]
CameraIconBtn --> CameraActivate["A さんがカメラ起動ボタンをタップ 🔴P1-61"]
CameraActivate --> GetAPos["A さんの現在地を送信 🔴P1-62"]
GetAPos --> AreaCheckResult{"エリア判定: 両者の現在地が 100m 以内? 🔴P1-63"}
WaitAreaCheckResult --> AreaCheckResult
AreaCheckResult -->|外| ErrNotClose["相手が近くにいません 🔴P1-64"]
AreaCheckResult -->|内| IssueToken["トークン発行 (30 秒) と QR 表示 🔴P1-65"]
IssueToken --> ShowQR["QR 表示 (ワンタイムトークン) 🔴P1-66"]

ShowQR --> ScanByPartner["A さんがスキャン 🔴P1-67"]
ScanByPartner --> PostVerify["POST /verify 🔴P1-68"]
PostVerify --> DBUpdate["DB 更新: completed / 会った回数 +1 🔴P1-69"]
DBUpdate --> RankRecalc["ランク再計算 (会った回数・レビュー評価) 🔴P1-70"]
RankRecalc --> VerifyOk["認証成功レスポンス 🔴P1-71"]
VerifyOk --> DateCompletePopup["ポップアップ: 『いってらっしゃい、デート楽しんで！<br>終わったらレビューをお願いします』 🔴P1-72"]
DateCompletePopup --> ReviewWriteBtn["チャット画面に『レビューを書く』ボタン表示 🔴P1-73"]
ReviewWriteBtn -->|ボタンクリック| ReviewScreen["レビュー画面に遷移 🔴P1-74"]
ReviewScreen --> CheckHistory["過去に会った回数取得 🔴P1-75"]
CheckHistory -->|0 回| FullScore["ポイント 100% 加算 🔴P1-76"]
CheckHistory -->|1 回| LowScore["ポイント 10% 加算 🔴P1-77"]
CheckHistory -->|2 回以上| NoScore["加算なし 🔴P1-78"]
DBUpdate --> ReviewInput["レビュー入力フォーム表示 🔴P1-79"]
ReviewInput --> RatingSelect["星評価を選択 (★1 ～ 5) 🔴P1-80"]
RatingSelect --> CommentInput["コメント入力 (任意) 🔴P1-81"]
CommentInput --> ReviewSubmit["レビュー送信 (必須) 🔴P1-82"]
ReviewSubmit --> PostReview["POST /review 送信 🔴P1-83"]
PostReview --> DBReviewSave["DB: レビュー評価 & コメント保存 🔴P1-84"]
DBReviewSave --> RankRecalcReview["ランク再計算 (レビュー評価を反映) 🔴P1-85"]
CheckHistory -->|0 回| FullScore
CheckHistory -->|1 回| LowScore
CheckHistory -->|2 回以上| NoScore

Chat --> RealTimeCheck{"チャット画面を開いている? 🔴P1-86"}
RealTimeCheck -->|Yes| SocketFlow["Socket push 受信/送信 🔴P1-87"]
RealTimeCheck -->|No| PollingFlow["3 秒ごとに GET /chat/{id}/messages 🔴P1-88"]
PollingFlow --> PollFetch["履歴取得し新着表示 🔴P1-89"]

NotifyPartner -->|相手が慌ててスキャン| VerifiedPenalty["合流完了 (ペナルティあり) 🔴P1-90"]
VerifiedPenalty --> MannerPenalty["『マナー点』減点 🔴P1-91"]
VerifiedPenalty --> TroubleReview["レビュー画面に『トラブル報告』欄表示 🔴P1-92"]
NotifyPartner -->|一定時間経過（反応なし）| Cancelled["不成立 (ドタキャン確定) 🔴P1-93"]

Profile --> CheckFanclubOpened{"ファンクラブ開設済み? 🟡P3-07"}
CheckFanclubOpened -->|"開設済み"| FanclubJoinBtn["ファンクラブへ加入ボタン (メンバー UI) 🟡P3-08"]
FanclubJoinBtn --> FanclubJoin["ファンクラブ加入処理 (月額 500 円) 🟡P3-09"]
FanclubJoin --> FanclubPayment["決済処理 (購入者側) 🟡P3-10"]
FanclubPayment --> FanclubRecorded["売上として記録 🟡P3-11"]
FanclubRecorded --> MonthlyBilling["月次自動引き落とし (継続課金) 🟡P3-12"]
MonthlyBilling --> MonthlySettlement["月次決済処理 (自動) 🟡P3-13"]
CheckFanclubOpened -->|その他| NoFanclub[" "]

Profile --> CheckLiveStreamBroadcasting{"ライブ配信中? 🟡P3-14"}
CheckLiveStreamBroadcasting -->|"Yes"| BroadcastLive["ライブ配信視聴 🟡P3-15"]
BroadcastLive --> Tipping["投げ銭ボタン 🟡P3-16"]
BroadcastLive --> LiveFanclubBtn["ファンクラブ加入ボタン (ライブ配信画面下部) 🟡P3-17"]
Tipping --> TippingPayment["投げ銭決済 (投げ銭者側) 🟡P3-18"]
LiveFanclubBtn -->|クリック| FanclubJoinFromLive["ファンクラブ加入処理 (月額 500 円) 🟡P3-19"]
FanclubJoinFromLive --> FanclubPaymentLive["決済処理 (購入者側) 🟡P3-20"]
TippingPayment --> TippingRecorded["売上として記録 🟡P3-21"]
TippingRecorded --> MonthlySettlement
CheckLiveStreamBroadcasting -->|No| NoLiveStreamBroadcast[" "]

Profile --> CheckCallTicketAvailable{"通話チケット販売中? 🟡P3-22"}
CheckCallTicketAvailable -->|"販売中"| CallTicketCardsDisplay["販売中チケットカード一覧 🟡P3-23"]
CallTicketCardsDisplay --> CallTicketCard["チケットカード (購入ボタン付き) 🟡P3-24"]
CallTicketCard -->|クリック購入| CallTicketPayment["決済処理 (購入者側) 🟡P3-25"]
CallTicketPayment --> CallTicketRecorded["売上として記録 🟡P3-26"]
CallTicketRecorded --> MonthlySettlement
CheckCallTicketAvailable -->|販売なし| NoCallTicketAvailable[" "]

MyIcon --> Sidebar["サイドバー 🔴P1-94"]
Sidebar --> TicketListApproved["承諾済みチケット一覧 🔴P1-95"]
TicketListApproved --> TicketDetailLink["QR 詳細へのリンク移動 🔴P1-96"]
TicketDetailLink --> Chat

Sidebar --> TicketListPending["申請中チケット一覧 🔴P1-97"]
TicketListPending --> TicketDetailLink

Sidebar --> AdminGate{"管理者? ⚪ スキップ"}
AdminGate -->|Yes| AdminOption["管理画面へ ⚪ スキップ"]
Sidebar --> BoostIcon["ブースト課金 🟠P2-15"]
Sidebar --> IconFramePurchase["アイコンフレーム購入 🟠P2-16"]
Sidebar --> GiftPurchase["ギフト購入 🟡P3-27"]
GiftPurchase --> SelectGiftTarget["送り先選択 🟡P3-28"]
SelectGiftTarget --> CheckGiftReceivable{"受取権限あり? 🟡P3-29"}
CheckGiftReceivable -->|女性 R3-5 / 男性 R5| AllowGift["ギフト選択 & 送信 🟡P3-30"]
CheckGiftReceivable -->|不可| BlockGift["× 送信不可 🟡P3-31"]
AllowGift --> GiftPayment["決済処理 (購入者側) 🟡P3-32"]
GiftPayment --> GiftRecorded["売上として記録 🟡P3-33"]
GiftRecorded --> MonthlySettlement
GiftPayment --> SendGift["ギフト送信完了 🟡P3-34"]

Sidebar --> GiftReceive["ギフト受け取り 🟡P3-35"]
GiftReceive --> CheckGiftReceiveRank{"受取権限あり? 🟡P3-36"}
CheckGiftReceiveRank -->|女性 R3-5 / 男性 R5| GiftInbox["受信ギフト一覧 🟡P3-37"]
CheckGiftReceiveRank -->|その他| PopupGiftBlocked["ポップアップ: 条件ランクで受取可能\n ランク条件を見る 🟡P3-38"]
PopupGiftBlocked --> RankHelpGift["ランク条件ヘルプ (昇格条件) 🟡P3-39"]
GiftInbox --> OpenGift["ギフトを開く 🟡P3-40"]

Sidebar --> FootprintHistorySidebar["足跡履歴 🟠P2-17"]
FootprintHistorySidebar --> CheckFootprintAuth{"足跡閲覧権限? 🟠P2-18"}
CheckFootprintAuth -->|"男性 Rank1-2 (通常)"| FPBlockMen12["閲覧不可 🟠P2-19"]
CheckFootprintAuth -->|"男性 Rank1-2 (Premium)"| FPUnlimMen12P["● 無制限 🟠P2-20"]
CheckFootprintAuth -->|"男性 Rank3 (通常)"| FPLimitedMen3["直近 3 人 🟠P2-21"]
CheckFootprintAuth -->|"男性 Rank3 (Premium)"| FPUnlimMen3P["● 無制限 🟠P2-22"]
CheckFootprintAuth -->|"男性 Rank4-5"| FPUnlimMen45["● 無制限 🟠P2-23"]
CheckFootprintAuth -->|"女性 Rank1-2 (通常)"| FPBlockWomen12["閲覧不可 🟠P2-24"]
CheckFootprintAuth -->|"女性 Rank1-2 (Premium)"| FPUnlimWomen12P["● 無制限 🟠P2-25"]
CheckFootprintAuth -->|"女性 Rank3-5"| FPUnlimWomen35["● 無制限 🟠P2-26"]
FPUnlimMen12P --> FootprintList["足跡履歴一覧 🟠P2-27"]
FPLimitedMen3 --> FootprintList
FPUnlimMen3P --> FootprintList
FPUnlimMen45 --> FootprintList
FPUnlimWomen12P --> FootprintList
FPUnlimWomen35 --> FootprintList
FPBlockMen12 --> PopupFootprintBlocked["ポップアップ: 権限なし (Premium 加入で解除) 🟠P2-28"]
FPBlockWomen12 --> PopupFootprintBlocked
FootprintList --> FootprintItem["『A さんが足跡をつけました』 🟠P2-29"]
FootprintItem -->|クリック| Profile

Sidebar --> MyProfile["自分のプロフィール 🔴P1-98"]
Sidebar --> ReceiveSettings["受信設定 🟠P2-30"]
Sidebar --> RedeemMenu["還元オプション 🟡P3-41"]
ReceiveSettings --> CheckFemaleRank{"女性ランク? 🟠P2-31"}
CheckFemaleRank -->|"Rank2 以上"| FemaleFilters["受信フィルター設定 🟠P2-32"]
CheckFemaleRank -->|その他| PopupReceiveBlocked["ポップアップ: 条件ランクで設定可\n ランク条件を見る 🟠P2-33"]
FemaleFilters --> ToggleRank1Block["Rank1 ブロック (R2+のみ受信) 🟠P2-34"]
FemaleFilters --> ToggleRank2Block["Rank2 以下ブロック (R3+のみ受信) 🟠P2-35"]
FemaleFilters --> ToggleRank3Block["Rank3 以下ブロック (R4+のみ受信) 🟠P2-36"]

ReceiveSettings --> CheckMaleRank{"男性ランク? 🟠P2-37"}
CheckMaleRank -->|"Rank5 のみ"| TributeFilter["貢ぎフィルター 🟠P2-38"]
TributeFilter --> TributeFilterRule["ギフト贈答者のみ受信 (ON で絞り込み) 🟠P2-39"]
CheckMaleRank -->|"Rank1-4"| PopupReceiveBlocked
PopupReceiveBlocked --> RankHelpReceive["ランク条件ヘルプ (昇格条件) 🟠P2-40"]

MyProfile --> MyProfileEdit["プロフィール編集 🔴P1-99"]
MyProfileEdit --> IconRingSetting["アイコンリング設定 (付外し/付替) 🟠P2-41"]

MyProfile --> CheckLiveStreamRank{"ライブ配信可能? 🟡P3-42"}
CheckLiveStreamRank -->|"Rank5 男女とも"| LiveStreamSetup["ライブ配信開始ボタン 🟡P3-43"]
LiveStreamSetup --> ConfigLiveStream["配信設定 🟡P3-44"]
ConfigLiveStream --> StartBroadcast["ライブ配信開始 🟡P3-45"]
StartBroadcast --> CheckBroadcasterRank{"Rank5 男性? 🟡P3-46"}
CheckBroadcasterRank -->|Yes| LiveChatTicketSale["ライブチャットで通話チケット販売 🟡P3-47"]
CheckBroadcasterRank -->|No| NoBroadcasterTicket[" "]
CheckLiveStreamRank -->|その他| NoLiveStream[" "]

MyProfile --> ShareRank["ランクをシェアする 🟠P2-42"]
ShareRank --> GenerateShareImage["シェア用画像生成 (ランク・アバター・ハッシュタグ) 🟠P2-43"]
GenerateShareImage --> ShareToSNS["SNS シェア画面起動 🟠P2-44"]
ShareToSNS --> ViralEffect["拡散効果 (新規ユーザー獲得) 🟠P2-45"]

MyProfile --> CheckFanclubSetupRank{"ファンクラブ開設可能? 🟡P3-48"}
CheckFanclubSetupRank -->|"Rank5 男女とも"| FanclubSetupBtn["ファンクラブ開設ボタン 🟡P3-49"]
FanclubSetupBtn --> FanclubCreate["ファンクラブ開設 🟡P3-50"]
FanclubCreate --> FanclubSetupComplete["開設完了 🟡P3-51"]
CheckFanclubSetupRank -->|その他| NoFanclubSetup[" "]

MyProfile --> CheckCallTicketSetupRank{"通話チケット販売可能? 🟡P3-52"}
CheckCallTicketSetupRank -->|"男性 Rank5 のみ"| CallTicketSetupBtn["チケット販売設定ボタン 🟡P3-53"]
CallTicketSetupBtn --> CallTicketSetup["チケット価格・時間設定 🟡P3-54"]
CallTicketSetup --> CallTicketSetupComplete["設定完了 🟡P3-55"]
CheckCallTicketSetupRank -->|その他| NoCallTicketSetup[" "]

AdminOption --> AdminDashboard["管理者画面 ⚪ スキップ"]

BellIcon --> NotificationCenter["通知センター 🟠P2-46"]
NotificationCenter --> MatchingRequestInbox["マッチング依頼受信履歴 🟠P2-47"]
NotificationCenter --> FootprintHistory["足跡の履歴 🟠P2-48"]

MatchingRequestInbox --> MatchingRequestItem["マッチング依頼 (初メッセージ付き) 🟠P2-49"]
MatchingRequestItem --> AcceptOrReject{"承諾 or 拒否? 🟠P2-50"}
AcceptOrReject -->|承諾| AcceptMatching["承諾 → チャット開始 🟠P2-51"]
AcceptMatching --> AddToReplyCalc["返信率計算対象に追加 (承諾数+1) 🔴P1-100"]
AddToReplyCalc --> Chat
AcceptOrReject -->|拒否 or 放置| RejectMatching["拒否/放置 (7 日で期限切れ) 🟠P2-52"]
RejectMatching --> NotInCalc["返信率計算対象外 🔴P1-101"]

BoostIcon --> BoostLogic["ブースト購入フロー 🟠P2-53"]
BoostLogic --> BoostPayment["決済処理 (ブースト料金) 🟠P2-54"]
BoostPayment --> ActivateBoost["ブースト有効化 (30 分間) 🟠P2-55"]
ActivateBoost --> BoostEffects["効果適用 🟠P2-56"]
BoostEffects --> DisplayPriority["表示順位: 最上位 (Boost マーク付き / 30 分間) 🟠P2-57"]
BoostEffects --> CheckGenderBoost{"性別判定 🟠P2-58"}
CheckGenderBoost -->|"男性"| CheckMaleRankBoost{"Rank 確認 🟠P2-59"}
CheckGenderBoost -->|"女性"| CheckFemaleRankBoost{"Rank 確認 🟠P2-60"}
CheckMaleRankBoost -->|"Rank1"| MaleMsgBoost1["3 通/日 + 追加10通(使い切り) 🟠P2-61"]
CheckMaleRankBoost -->|"Rank2"| MaleMsgBoost2["5 通/日 + 追加10通(使い切り) 🟠P2-62"]
CheckMaleRankBoost -->|"Rank3"| MaleMsgBoost3["10 通/日 + 追加10通(使い切り) 🟠P2-63"]
CheckMaleRankBoost -->|"Rank4-5"| MaleMsgBoost45["無制限 🟠P2-64"]
CheckFemaleRankBoost -->|"Rank1"| FemaleMsgBoost1["3 通/日 + 追加10通(使い切り) 🟠P2-65"]
CheckFemaleRankBoost -->|"Rank2"| FemaleMsgBoost2["10 通/日 + 追加10通(使い切り) 🟠P2-66"]
CheckFemaleRankBoost -->|"Rank3 以上"| FemaleMsgBoost3["無制限 🟠P2-67"]
MaleMsgBoost1 --> CheckBoostRestrictions{"機能制限チェック 🟠P2-68"}
MaleMsgBoost2 --> CheckBoostRestrictions
MaleMsgBoost3 --> CheckBoostRestrictions
MaleMsgBoost45 --> CheckBoostRestrictions
FemaleMsgBoost1 --> CheckBoostRestrictions
FemaleMsgBoost2 --> CheckBoostRestrictions
FemaleMsgBoost3 --> CheckBoostRestrictions
CheckBoostRestrictions -->|ライブ配信試行| BlockLiveStream["× ブロック (事故防止) 🟠P2-69"]
CheckBoostRestrictions -->|ファンクラブ開設試行| BlockFanclub["× ブロック (詐欺防止) 🟠P2-70"]
CheckBoostRestrictions -->|受信フィルター| RankFilterCheck["相手の Rank 制限で拒否される 🟠P2-71"]
ActivateBoost --> BoostTimer["タイマー: 30 分後に自動解除 🟠P2-72"]
BoostTimer --> RevertToNormal["通常状態に戻る (Rank1 の制限) 🟠P2-73"]

IconFramePurchase --> FramePurchase["アイコンフレーム購入フロー 🟠P2-74"]
FramePurchase --> FramePayment["決済処理 🟠P2-75"]
FramePayment --> FrameDBItem["在庫付与 🟠P2-76"]
FrameDBItem --> FrameApply["プロフィールに適用 🟠P2-77"]

MonthlySettlement --> AggregateRevenue["月次売上集計 🟡P3-56"]
AggregateRevenue --> BreakdownRevenue["収入元別に集計 🟡P3-57"]
BreakdownRevenue -->|ファンクラブ加入| FCCount["加入者数 × 500 円 🟡P3-58"]
BreakdownRevenue -->|ギフト受け取り| GiftSum["受け取ったギフト総額 🟡P3-59"]
BreakdownRevenue -->|通話チケット売上| TicketSum["販売したチケット総額 🟡P3-60"]
BreakdownRevenue -->|ライブ投げ銭| TippingSum["受け取った投げ銭総額 🟡P3-61"]
FCCount --> TotalMonthly["月間売上合計 🟡P3-62"]
GiftSum --> TotalMonthly
TicketSum --> TotalMonthly
TippingSum --> TotalMonthly
TotalMonthly --> DeductCommission["手数料 30% 控除 🟡P3-63"]
DeductCommission --> CreatorMonthlyRevenue["70% がクリエーター収益 🟡P3-64"]
CreatorMonthlyRevenue --> MonthlyReceiverWallet["作り手ウォレットへ反映 🟡P3-65"]
MonthlyReceiverWallet --> MonthlyAdminRevenue["運営収益へ 🟡P3-66"]

Timeline --> Card
Timeline --> DisplayOrder["表示順位ルール 🔴P1-102"]
DisplayOrder --> RankBoost["表示: 最優先 (Boost中) 🟠P2-78"]
DisplayOrder --> RankGod["表示: 次点(Rank5) 🔴P1-103"]
DisplayOrder --> RankHigh["表示: その次(Rank4) 🔴P1-104"]
DisplayOrder --> RankMid["表示: その次(Rank3) 🔴P1-105"]
DisplayOrder --> RankLow["表示: 下位(Rank1-2) 🔴P1-106"]
RankBoost --> BoostMen["男性 Boost中 (Rank不問) 🟠P2-80"]
RankBoost --> BoostWomen["女性 Boost中 (Rank不問) 🟠P2-81"]
RankGod --> GodMen["男性 Rank5 🔴P1-107"]
RankGod --> GodWomen["女性 Rank5 🔴P1-108"]
RankHigh --> HighMen["男性 Rank4 🟠P2-84"]
RankHigh --> HighWomen["女性 Rank4 🟠P2-85"]
RankMid --> MidMen["男性 Rank3 🟠P2-86"]
RankMid --> MidWomen["女性 Rank3 🟠P2-87"]
RankLow --> LowMen["男性 Rank1-2 🔴P1-109"]
RankLow --> LowWomen["女性 Rank1-2 🔴P1-110"]
DisplayOrder --> ActiveOrder["各順位帯の中ではアクティブユーザー順 🔴P1-111"]

RedeemMenu --> CheckRedeemRank{"換金権限あり? 🟡P3-67"}
CheckRedeemRank -->|男性 Rank5 or 女性 Rank4-5| RedeemOption["還元オプション (活性化) 🟡P3-68"]
CheckRedeemRank -->|その他| PopupRedeemBlocked["ポップアップ: 条件ランクで換金可能\n ランク条件を見る 🟡P3-69"]
PopupRedeemBlocked --> RankHelpRedeem["ランク条件ヘルプ (昇格条件) 🟡P3-70"]
RedeemOption --> RedeemProcess["換金処理 🟡P3-71"]
RedeemProcess --> CheckRedeemRate{"換金率判定 🟡P3-72"}
CheckRedeemRate -->|女性 Rank4 or 男性 Rank5| Rate50["換金率 50% 🟡P3-73"]
CheckRedeemRate -->|女性 Rank5| Rate70["換金率 70% 🟡P3-74"]
Rate50 --> TransferUser50["50% をユーザー口座へ振込 🟡P3-75"]
Rate70 --> TransferUser70["70% をユーザー口座へ振込 🟡P3-76"]
TransferUser50 --> TransferAdmin50["50% を運営口座へ 🟡P3-77"]
TransferUser70 --> TransferAdmin70["30% を運営口座へ 🟡P3-78"]

AdminDashboard --> AdminAccount["運営口座情報登録 ⚪ スキップ"]
AdminDashboard --> AdminDebug["デバッグ機能 ⚪ スキップ"]
AdminDashboard --> AdminBan["迷惑ユーザー追放 ⚪ スキップ"]
AdminDashboard --> AdminDeleteAccount["ユーザー口座情報削除 ⚪ スキップ"]
AdminDashboard --> AdminRedeemRate["還元率管理 ⚪ スキップ"]

subgraph Ranks [ランク概要]
subgraph Male [男性ランク]
M1["Rank1 メッセージ 3/日 🔴P1-111<br>【昇格】本人確認 + 返信率 80%+ + 会 5+<br>【降格】返信率 60%未満（30 日継続）"]
M2["Rank2 メッセージ 5/日 🟠P2-88<br>【昇格】返信率 85%+ + 会 10+ + レビュー 3.5+<br>【降格】返信率 70%未満（30 日継続）"]
M3["Rank3 メッセージ 10/日 🟠P2-89<br>【昇格】返信率 90%+ + 会 20+ + レビュー 4.0+<br>【降格】返信率 75%未満（30 日継続）"]
M4["Rank4 無制限 🟠P2-90<br>【昇格】返信率 90%+ + 会 50+ + レビュー 4.5+ + マナー 100 点<br>【降格】返信率 80%未満（30 日継続）"]
M5["Rank5 無制限 + ライブ/ファンクラブ 🟡P3-79<br>【降格】返信率 85%未満（30 日継続） OR レビュー 4.5 未満"]
end
subgraph Female [女性ランク]
F1["Rank1 メッセージ 3/日 🔴P1-112<br>【昇格】本人確認 + 返信率 80%+ + 会 5+<br>【降格】返信率 60%未満（30 日継続）"]
F2["Rank2 メッセージ 10/日 🟠P2-91<br>【昇格】返信率 85%+ + 会 10+ + レビュー 3.5+<br>【降格】返信率 70%未満（30 日継続）"]
F3["Rank3 無制限 + ギフト受取 🟠P2-92<br>【昇格】返信率 90%+ + 会 20+ + レビュー 4.0+<br>【降格】返信率 75%未満（30 日継続）"]
F4["Rank4 優先表示 + 換金(50%) 🟠P2-93<br>【昇格】返信率 90%+ + 会 50+ + レビュー 4.5+ + マナー 100 点<br>【降格】返信率 80%未満（30 日継続）"]
F5["Rank5 全権限 + 換金(70%) 🟡P3-80<br>【降格】返信率 85%未満（30 日継続） OR レビュー 4.5 未満"]
end
end
M1 --> M2 --> M3 --> M4 --> M5
F1 --> F2 --> F3 --> F4 --> F5

Timeline --> M1
Timeline --> F1
PostVerify --> CheckHistory

classDef warn fill:#3f000f,stroke:#f87171,color:#fff
class ErrNotClose,Cancelled warn
