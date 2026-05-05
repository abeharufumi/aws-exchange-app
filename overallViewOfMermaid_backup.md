%%{init: {'theme': 'dark'}}%%
flowchart LR

%% 優先順位凡例
%% 🔴P1: フェーズ1（MVP）- 1-2ヶ月で必須実装
%% 🟠P2: フェーズ2（ユーザー拡大）- 3-4ヶ月で実装
%% 🟡P3: フェーズ3（収益化）- 5-6ヶ月以降で実装
%% ⚪スキップ: 後回し・オプション

Start["トップ画面 🔴P1"] --> Login{"[P1-1] 未ログイン? 🔴P1"}
Login -->|Yes| Signin["[P1-2] ログイン / サインアップ 🔴P1"]
Login -->|No| AppLayout["[P2-1] 画面レイアウト 🔴P1"]
AppLayout --> TopNav["[P2-2] 画面上部: タブナビゲーション 🔴P1"]
AppLayout --> BottomNav["[P2-3] 画面下部: ナビゲーションバー 🔴P1"]

TopNav -->|デフォルト| Timeline["タイムライン (異性ユーザー) 🔴P1"]
TopNav -->|スライド式| LiveTab["配信動画タブ 🟡P3"]
LiveTab --> LiveStream["配信動画 🟡P3"]
LiveStream --> WatchLiveStream["[P18-3d] 対象者のライブ配信に入室 🟡P3"]
WatchLiveStream --> CheckFanclubMember{"[P18-3e] 入室者がファンクラブ会員? 🟡P3"}
CheckFanclubMember -->|Yes| NotifyWithIcon["[P18-3f] ライブチャットに『会員アイコン + ●● さんが入室しました』を自動表示 (配信者側) 🟡P3"]
CheckFanclubMember -->|No| NotifyWithoutIcon["[P18-3g] ライブチャットに『●● さんが入室しました』を自動表示 (配信者側) 🟡P3"]
TopNav -->|増加可能| OtherTabs["その他タブ ⚪スキップ"]

BottomNav --> HomeIcon["ホーム 🔴P1"]
BottomNav --> SearchIcon["虫眼鏡アイコン (検索) 🔴P1"]
BottomNav --> MyIcon["自分のアイコン 🔴P1"]
BottomNav --> BellIcon["鈴アイコン (通知) 🟠P2"]

HomeIcon --> Timeline

SearchIcon --> SearchUsers["[P4-1] ユーザー検索 🔴P1"]
SearchUsers --> CheckSearchRank{"[P4-2] 検索権限確認 🔴P1"}
CheckSearchRank -->|"Rank1 通常 / Rank1+Boost"| BasicSearch["[P4-3] 基本検索 (地域のみ) 🔴P1"]
CheckSearchRank -->|"Rank1 Premium +Boost"| AdvancedSearch["[P4-4] 詳細検索 (年齢/ランク/目的/地域) 🟠P2"]
CheckSearchRank -->|"Rank2 通常 / Rank2+Boost"| AgeSearch["[P4-5] 地域 + 年齢検索 🟠P2"]
CheckSearchRank -->|"Rank2 Premium +Boost"| AdvancedSearch
CheckSearchRank -->|"Rank3 以上 全状態"| AdvancedSearch
BasicSearch --> FilteredCards["[P5-1] ヒットしたユーザーカードを表示 🔴P1"]
AgeSearch --> FilteredCards
AdvancedSearch --> FilteredCards
FilteredCards --> Card["[P3-1] ユーザーカード 🔴P1"]
Card --> Profile["[P5-2] プロフィール閲覧 🔴P1"]
Profile --> MatchingReqBtn["[P6-1] マッチングを依頼 🔴P1"]
MatchingReqBtn -->|クリック| MatchingPopup["[P6-2] 初メッセージ入力ポップアップ 🔴P1"]
MatchingPopup -->|送信| SendMatchingReq["[P6-3] マッチング依頼 + 初メッセージ送信 🔴P1"]
SendMatchingReq --> MatchingBtn1["[P6-4] ボタンテキスト: 『依頼中』 🔴P1"]

MatchingBtn1 -->|相手が承諾| MatchingBtn2["[P7-1] ボタンテキスト: 『マッチング中』 🔴P1"]
MatchingBtn2 --> MailIcon["[P7-2] メールアイコン表示 🔴P1"]
MailIcon -->|クリック| Chat["[P8-1] チャット画面 🔴P1"]

MatchingBtn1 -->|相手が承諾しない または 7 日経過| MatchingBtn1Back["[P6-5] ボタンテキスト戻す: 『マッチングを依頼』 🔴P1"]
MatchingBtn1Back --> MatchingReqReceive["[P7-3] 相手が鈴アイコンから履歴確認 🟠P2"]

Chat --> CheckMsgQuota{"[P9-1] 送信上限チェック (1. メッセージ送信数) 🔴P1"}
CheckMsgQuota -->|"男性 Rank1 通常"| MsgMen1["[P9-2] 上限: 3 通/日 🔴P1"]
CheckMsgQuota -->|"男性 Rank1 Boost"| MsgMen1B["[P9-3] 上限: 3 通/日 + 10 通 🟠P2"]
CheckMsgQuota -->|"男性 Rank2 通常"| MsgMen2["[P9-4] 上限: 5 通/日 🟠P2"]
CheckMsgQuota -->|"男性 Rank2 Boost"| MsgMen2B["[P9-5] 上限: 5 通/日 + 10 通 🟠P2"]
CheckMsgQuota -->|"男性 Rank3 通常"| MsgMen3["[P9-6] 上限: 10 通/日 🟠P2"]
CheckMsgQuota -->|"男性 Rank3 Boost"| MsgMen3B["[P9-7] 上限: 10 通/日 + 10 通 🟠P2"]
CheckMsgQuota -->|"女性 Rank1 通常"| MsgWomen1["[P9-8] 上限: 3 通/日 🔴P1"]
CheckMsgQuota -->|"女性 Rank1 Boost"| MsgWomen1B["[P9-9] 上限: 3 通/日 + 10 通 🟠P2"]
CheckMsgQuota -->|"女性 Rank2 通常"| MsgWomen2["[P9-10] 上限: 10 通/日 🟠P2"]
CheckMsgQuota -->|"女性 Rank2 Boost"| MsgWomen2B["[P9-11] 上限: 10 通/日 + 10 通 🟠P2"]
CheckMsgQuota -->|"Premium 全 Rank / Rank4-5 全状態 / 女性 Rank3-5 全状態"| MsgUnlimited["[P9-12] 上限: 無制限 🟠P2"]
MsgMen1 --> QuotaCheck{"[P9-13] 本日の送信回数チェック 🔴P1"}
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
QuotaCheck -->|上限に達している| PopupQuotaExceeded["[P9-14] ポップアップ: 送信回数が上限に達しています 🔴P1"]
QuotaCheck -->|送信可能| MsgSend["[P8-2] メッセージ送信 🔴P1"]
PopupQuotaExceeded --> UpgradePrompt["[P9-15] プレミアム加入 or ランク昇格案内 🟠P2"]
MsgSend --> CountAsReply["[P9-16] 返信数カウント +1 🔴P1"]
CountAsReply --> UpdateReplyRate["[P9-17] 返信率更新: (返信数 / 承諾数) × 100% 🔴P1"]

Chat --> ScrollDetect["[P10-6] QR ボタン領域までスクロール検知 🔴P1"]
ScrollDetect --> CheckTime{"[P10-7] 約束時刻か? 🔴P1"}
CheckTime -->|No| QRDisabledFromChat["[P10-8] QR ボタン グレーアウト 🔴P1"]
CheckTime -->|Yes| QRActive["[P10-9] QR ボタン 活性化 🔴P1"]
CheckTime -->|Yes| Wait30Min["[P10-9a] 約束時間以降一度でも QR が表示されたか監視 🔴P1"]
CheckTime -->|Yes| CameraIconBtn["[P10-10a] カメラアイコンボタンが活性化 (A さん側) 🔴P1"]

Chat --> BookDateBtn["[P10-1] デートを申し込むボタン 🔴P1"]
BookDateBtn -->|クリック| DatePopup["[P10-2] 日付入力ポップアップ (右下に送信ボタン) 🔴P1"]
DatePopup -->|送信| CreateMeet["[P10-3] 約束作成: 日時のみ 🔴P1"]
CreateMeet --> APIMeet["[P10-4] POST /meet_requests で request_id 🔴P1"]
APIMeet --> ShowInactiveQRBtn["[P10-5] 非活性の QR ボタン表示 (デート申し込み側のみ) 🔴P1"]
APIMeet --> MeetNotifyA["[P10-4a] A さんに約束リクエスト通知 🔴P1"]
MeetNotifyA --> MeetAcceptA{"[P10-4b] A さんが約束を承諾? 🔴P1"}
MeetAcceptA -->|承諾| ShowInactiveCameraA["[P10-10b] 非活性のカメラアイコン表示 (A さん側) 🔴P1"]
MeetAcceptA -->|拒否| NotifyRejectB["[P10-4c] B さんに『A さんが約束を却下しました』通知 🔴P1"]
NotifyRejectB --> HideInactiveQR["[P10-5b] 非活性の QR ボタンを非表示 (B さん側) 🔴P1"]
ShowInactiveCameraA -->|タップ| CameraInactivePopup["[P10-10c] ポップアップ: デート当日 B さんの QR を読み取ってください 🔴P1"]
ShowInactiveQRBtn -->|ボタンタップ| QRPopupMsg["[P10-5a] ポップアップ: 『当日現場に着いたら押せるようになります。当日読み取ってもらってください』 🔴P1"]
QRActive --> QRRequestPos["[P11-6] B さんが QR 要求 (現在地を送信) 🔴P1"]
Wait30Min -->|No: 初回| ArrivalPopupFirst["[P10-9c] 約束時間から 30 分経過しました。相手は現場に到着しそうですか？ 🔴P1"]
Wait30Min -->|No: 2 回目以降| ArrivalPopupLoop["[P10-9c-2] さらに 30 分経過しました。相手は現場に到着しそうですか？ 🔴P1"]
ArrivalPopupFirst -->|はい| Wait30Min
ArrivalPopupLoop -->|はい| Wait30Min
ArrivalPopupFirst -->|いいえ| TroubleOptions["[P10-11] ポップアップ: どうしましたか？ 🔴P1"]
ArrivalPopupLoop -->|いいえ| TroubleOptions
TroubleOptions -->|"予定がキャンセルになりました"| CancelledAgreed["[P10-16b] 予定キャンセル (合意) 🔴P1"]
CancelledAgreed --> QRDisabledCancelled["[P10-8b] QR ボタン グレーアウト (キャンセル済み) 🔴P1"]
QRDisabledCancelled -->|タップ| QRInvalidPopup["[P10-8c] ポップアップ: 無効です。再度デートを申し込んでください 🔴P1"]
TroubleOptions -->|"ドタキャンに合いました"| Reported["[P10-12] 通報状態 (緊急モード) 🔴P1"]
Reported --> NotifyPartner["[P10-12a] 相手 (A) に「B が通報しました」通知 🔴P1"]
QRRequestPos --> WaitAreaCheckResult["[P11-6a] A さんのエリア判定結果を待機 🔴P1"]
CameraIconBtn --> CameraActivate["[P11-1] A さんがカメラ起動ボタンをタップ 🔴P1"]
CameraActivate --> GetAPos["[P11-1a] A さんの現在地を送信 🔴P1"]
GetAPos --> AreaCheckResult{"[P11-7] エリア判定: 両者の現在地が 100m 以内? 🔴P1"}
WaitAreaCheckResult --> AreaCheckResult
AreaCheckResult -->|外| ErrNotClose["[P11-8] 相手が近くにいません 🔴P1"]
AreaCheckResult -->|内| IssueToken["[P11-9] トークン発行 (30 秒) と QR 表示 🔴P1"]
IssueToken --> ShowQR["[P10-10] QR 表示 (ワンタイムトークン) 🔴P1"]

ShowQR --> ScanByPartner["[P11-1b] A さんがスキャン 🔴P1"]
ScanByPartner --> PostVerify["[P11-2] POST /verify 🔴P1"]
PostVerify --> DBUpdate["[P11-3] DB 更新: completed / 会った回数 +1 🔴P1"]
DBUpdate --> RankRecalc["[P3-2] ランク再計算 (会った回数・レビュー評価) 🔴P1"]
RankRecalc --> VerifyOk["[P11-4] 認証成功レスポンス 🔴P1"]
VerifyOk --> DateCompletePopup["[P11-4a] ポップアップ: 『いってらっしゃい、デート楽しんで！<br>終わったらレビューをお願いします』 🔴P1"]
DateCompletePopup --> ReviewWriteBtn["[P11-4b] チャット画面に『レビューを書く』ボタン表示 🔴P1"]
ReviewWriteBtn -->|ボタンクリック| ReviewScreen["[P11-5] レビュー画面に遷移 🔴P1"]
ReviewScreen --> CheckHistory["[P11-10] 過去に会った回数取得 🔴P1"]
CheckHistory -->|0 回| FullScore["[P11-11] ポイント 100% 加算 🔴P1"]
CheckHistory -->|1 回| LowScore["[P11-12] ポイント 10% 加算 🔴P1"]
CheckHistory -->|2 回以上| NoScore["[P11-13] 加算なし 🔴P1"]
DBUpdate --> ReviewInput["[P11-5a] レビュー入力フォーム表示 🔴P1"]
ReviewInput --> RatingSelect["[P11-5b] 星評価を選択 (★1 ～ 5) 🔴P1"]
RatingSelect --> CommentInput["[P11-5c] コメント入力 (任意) 🔴P1"]
CommentInput --> ReviewSubmit["[P11-5d] レビュー送信 (必須) 🔴P1"]
ReviewSubmit --> PostReview["[P11-5e] POST /review 送信 🔴P1"]
PostReview --> DBReviewSave["[P11-5f] DB: レビュー評価 & コメント保存 🔴P1"]
DBReviewSave --> RankRecalcReview["[P11-5g] ランク再計算 (レビュー評価を反映) 🔴P1"]
CheckHistory -->|0 回| FullScore
CheckHistory -->|1 回| LowScore
CheckHistory -->|2 回以上| NoScore

Chat --> RealTimeCheck{"[P8-3] チャット画面を開いている? 🔴P1"}
RealTimeCheck -->|Yes| SocketFlow["[P8-4] Socket push 受信/送信 🔴P1"]
RealTimeCheck -->|No| PollingFlow["[P8-5] 3 秒ごとに GET /chat/{id}/messages 🔴P1"]
PollingFlow --> PollFetch["[P8-6] 履歴取得し新着表示 🔴P1"]

NotifyPartner -->|相手が慌ってスキャン| VerifiedPenalty["[P10-13] 合流完了 (ペナルティあり) 🔴P1"]
VerifiedPenalty --> MannerPenalty["[P10-14] 『マナー点』減点 🔴P1"]
VerifiedPenalty --> TroubleReview["[P10-15] レビュー画面に『トラブル報告』欄表示 🔴P1"]
NotifyPartner -->|一定時間経過（反応なし）| Cancelled["[P10-16] 不成立 (ドタキャン確定) 🔴P1"]

Profile --> CheckFanclubOpened{"[P15-1] ファンクラブ開設済み? 🟡P3"}
CheckFanclubOpened -->|"開設済み"| FanclubJoinBtn["[P15-2] ファンクラブへ加入ボタン (メンバー UI) 🟡P3"]
FanclubJoinBtn --> FanclubJoin["[P15-3] ファンクラブ加入処理 (月額 500 円) 🟡P3"]
FanclubJoin --> FanclubPayment["[P14-1] 決済処理 (購入者側) 🟡P3"]
FanclubPayment --> FanclubRecorded["[P15-4] 売上として記録 🟡P3"]
FanclubRecorded --> MonthlyBilling["[P20-0] 月次自動引き落とし (継続課金) 🟡P3"]
MonthlyBilling --> MonthlySettlement["[P20-1] 月次決済処理 (自動) 🟡P3"]
CheckFanclubOpened -->|その他| NoFanclub[" "]

Profile --> CheckLiveStreamBroadcasting{"[P18-4] ライブ配信中? 🟡P3"}
CheckLiveStreamBroadcasting -->|"Yes"| BroadcastLive["[P18-4] ライブ配信視聴 🟡P3"]
BroadcastLive --> Tipping["[P18-5] 投げ銭ボタン 🟡P3"]
BroadcastLive --> LiveFanclubBtn["[P18-6] ファンクラブ加入ボタン (ライブ配信画面下部) 🟡P3"]
Tipping --> TippingPayment["[P14-2] 投げ銭決済 (投げ銭者側) 🟡P3"]
LiveFanclubBtn -->|クリック| FanclubJoinFromLive["[P18-7] ファンクラブ加入処理 (月額 500 円) 🟡P3"]
FanclubJoinFromLive --> FanclubPaymentLive["[P14-1a] 決済処理 (購入者側) 🟡P3"]
TippingPayment --> TippingRecorded["[P18-6] 売上として記録 🟡P3"]
TippingRecorded --> MonthlySettlement
CheckLiveStreamBroadcasting -->|No| NoLiveStreamBroadcast[" "]

Profile --> CheckCallTicketAvailable{"[P19-1] 通話チケット販売中? 🟡P3"}
CheckCallTicketAvailable -->|"販売中"| CallTicketCardsDisplay["[P19-2] 販売中チケットカード一覧 🟡P3"]
CallTicketCardsDisplay --> CallTicketCard["[P19-3] チケットカード (購入ボタン付き) 🟡P3"]
CallTicketCard -->|クリック購入| CallTicketPayment["[P14-3] 決済処理 (購入者側) 🟡P3"]
CallTicketPayment --> CallTicketRecorded["[P19-4] 売上として記録 🟡P3"]
CallTicketRecorded --> MonthlySettlement
CheckCallTicketAvailable -->|販売なし| NoCallTicketAvailable[" "]

MyIcon --> Sidebar["[P7-4] サイドバー 🔴P1"]
Sidebar --> TicketListApproved["[P12-1] 承諾済みチケット一覧 🔴P1"]
TicketListApproved --> TicketDetailLink["[P12-2] QR 詳細へのリンク移動 🔴P1"]
TicketDetailLink --> Chat["[P8-1] チャット画面 (指定 QR までスクロール) 🔴P1"]

Sidebar --> TicketListPending["[P12-3] 申請中チケット一覧 🔴P1"]
TicketListPending --> TicketDetailLink

Sidebar --> AdminGate{"[P22-1] 管理者? ⚪スキップ"}
AdminGate -->|Yes| AdminOption["[P22-2] 管理画面へ ⚪スキップ"]
Sidebar --> BoostIcon["[P17-5] ブースト課金 🟠P2"]
Sidebar --> IconFramePurchase["[P2-4] アイコンフレーム購入 🟠P2"]
Sidebar --> GiftPurchase["[P16-1] ギフト購入 🟡P3"]
GiftPurchase --> SelectGiftTarget["[P16-2] 送り先選択 🟡P3"]
SelectGiftTarget --> CheckGiftReceivable{"[P16-3] 受取権限あり? 🟡P3"}
CheckGiftReceivable -->|女性 R3-5 / 男性 R5| AllowGift["[P16-4] ギフト選択 & 送信 🟡P3"]
CheckGiftReceivable -->|不可| BlockGift["[P16-5] × 送信不可 🟡P3"]
AllowGift --> GiftPayment["[P14-4] 決済処理 (購入者側) 🟡P3"]
GiftPayment --> GiftRecorded["[P16-6] 売上として記録 🟡P3"]
GiftRecorded --> MonthlySettlement
GiftPayment --> SendGift["[P16-7] ギフト送信完了 🟡P3"]

Sidebar --> GiftReceive["[P16-8] ギフト受け取り 🟡P3"]
GiftReceive --> CheckGiftReceiveRank{"[P16-9] 受取権限あり? 🟡P3"}
CheckGiftReceiveRank -->|女性 R3-5 / 男性 R5| GiftInbox["[P16-10] 受信ギフト一覧 🟡P3"]
CheckGiftReceiveRank -->|その他| PopupGiftBlocked["[P16-11] ポップアップ: 条件ランクで受取可能\n ランク条件を見る 🟡P3"]
PopupGiftBlocked --> RankHelpGift["[P16-12] ランク条件ヘルプ (昇格条件) 🟡P3"]
GiftInbox --> OpenGift["[P16-13] ギフトを開く 🟡P3"]

Sidebar --> FootprintHistorySidebar["[P12-4] 足跡履歴 🟠P2"]
FootprintHistorySidebar --> CheckFootprintAuth{"[P12-5] 足跡閲覧権限? 🟠P2"}
CheckFootprintAuth -->|"男性 Rank1-2 (通常)"| FPBlockMen12["[P12-6] 閲覧不可 🟠P2"]
CheckFootprintAuth -->|"男性 Rank1-2 (Premium)"| FPUnlimMen12P["[P12-7] ● 無制限 🟠P2"]
CheckFootprintAuth -->|"男性 Rank3 (通常)"| FPLimitedMen3["[P12-8] 直近 3 人 🟠P2"]
CheckFootprintAuth -->|"男性 Rank3 (Premium)"| FPUnlimMen3P["[P12-9] ● 無制限 🟠P2"]
CheckFootprintAuth -->|"男性 Rank4-5"| FPUnlimMen45["[P12-10] ● 無制限 🟠P2"]
CheckFootprintAuth -->|"女性 Rank1-2 (通常)"| FPBlockWomen12["[P12-11] 閲覧不可 🟠P2"]
CheckFootprintAuth -->|"女性 Rank1-2 (Premium)"| FPUnlimWomen12P["[P12-12] ● 無制限 🟠P2"]
CheckFootprintAuth -->|"女性 Rank3-5"| FPUnlimWomen35["[P12-13] ● 無制限 🟠P2"]
FPUnlimMen12P --> FootprintList["[P12-14] 足跡履歴一覧 🟠P2"]
FPLimitedMen3 --> FootprintList
FPUnlimMen3P --> FootprintList
FPUnlimMen45 --> FootprintList
FPUnlimWomen12P --> FootprintList
FPUnlimWomen35 --> FootprintList
FPBlockMen12 --> PopupFootprintBlocked["[P12-15] ポップアップ: 権限なし (Premium 加入で解除) 🟠P2"]
FPBlockWomen12 --> PopupFootprintBlocked
FootprintList --> FootprintItem["[P12-16] 『A さんが足跡をつけました』 🟠P2"]
FootprintItem -->|クリック| Profile["[P5-2] プロフィール (A さんの) 🔴P1"]

Sidebar --> MyProfile["[P13-1] 自分のプロフィール 🔴P1"]
Sidebar --> ReceiveSettings["[P13-2] 受信設定 🟠P2"]
Sidebar --> RedeemMenu["[P21-1] 還元オプション 🟡P3"]
ReceiveSettings --> CheckFemaleRank{"[P13-3] 女性ランク? 🟠P2"}
CheckFemaleRank -->|"Rank2 以上"| FemaleFilters["[P13-4] 受信フィルター設定 🟠P2"]
CheckFemaleRank -->|その他| PopupReceiveBlocked["[P13-5] ポップアップ: 条件ランクで設定可\n ランク条件を見る 🟠P2"]
FemaleFilters --> ToggleRank1Block["[P13-6] Rank1 ブロック (R2+のみ受信) 🟠P2"]
FemaleFilters --> ToggleRank2Block["[P13-7] Rank2 以下ブロック (R3+のみ受信) 🟠P2"]
FemaleFilters --> ToggleRank3Block["[P13-8] Rank3 以下ブロック (R4+のみ受信) 🟠P2"]

ReceiveSettings --> CheckMaleRank{"[P13-9] 男性ランク? 🟠P2"}
CheckMaleRank -->|"Rank5 のみ"| TributeFilter["[P13-10] 貢ぎフィルター 🟠P2"]
TributeFilter --> TributeFilterRule["[P13-11] ギフト贈答者のみ受信 (ON で絞り込み) 🟠P2"]
CheckMaleRank -->|"Rank1-4"| PopupReceiveBlocked
PopupReceiveBlocked --> RankHelpReceive["[P13-12] ランク条件ヘルプ (昇格条件) 🟠P2"]

MyProfile --> MyProfileEdit["[P13-13] プロフィール編集 🔴P1"]
MyProfileEdit --> IconRingSetting["[P2-5] アイコンリング設定 (付外し/付替) 🟠P2"]

MyProfile --> CheckLiveStreamRank{"[P18-1] ライブ配信可能? 🟡P3"}
CheckLiveStreamRank -->|"Rank5 男女とも"| LiveStreamSetup["[P18-2] ライブ配信開始ボタン 🟡P3"]
LiveStreamSetup --> ConfigLiveStream["[P18-3] 配信設定 🟡P3"]
ConfigLiveStream --> StartBroadcast["[P18-3a] ライブ配信開始 🟡P3"]
StartBroadcast --> CheckBroadcasterRank{"[P18-3b] Rank5 男性? 🟡P3"}
CheckBroadcasterRank -->|Yes| LiveChatTicketSale["[P18-3c] ライブチャットで通話チケット販売 🟡P3"]
CheckBroadcasterRank -->|No| NoBroadcasterTicket[" "]
CheckLiveStreamRank -->|その他| NoLiveStream[" "]

MyProfile --> ShareRank["[P23-1] ランクをシェアする 🟠P2"]
ShareRank --> GenerateShareImage["[P23-2] シェア用画像生成 (ランク・アバター・ハッシュタグ) 🟠P2"]
GenerateShareImage --> ShareToSNS["[P23-3] SNS シェア画面起動 🟠P2"]
ShareToSNS --> ViralEffect["[P23-4] 拡散効果 (新規ユーザー獲得) 🟠P2"]

MyProfile --> CheckFanclubSetupRank{"[P15-5] ファンクラブ開設可能? 🟡P3"}
CheckFanclubSetupRank -->|"Rank5 男女とも"| FanclubSetupBtn["[P15-6] ファンクラブ開設ボタン 🟡P3"]
FanclubSetupBtn --> FanclubCreate["[P15-7] ファンクラブ開設 🟡P3"]
FanclubCreate --> FanclubSetupComplete["[P15-8] 開設完了 🟡P3"]
CheckFanclubSetupRank -->|その他| NoFanclubSetup[" "]

MyProfile --> CheckCallTicketSetupRank{"[P19-5] 通話チケット販売可能? 🟡P3"}
CheckCallTicketSetupRank -->|"男性 Rank5 のみ"| CallTicketSetupBtn["[P19-6] チケット販売設定ボタン 🟡P3"]
CallTicketSetupBtn --> CallTicketSetup["[P19-7] チケット価格・時間設定 🟡P3"]
CallTicketSetup --> CallTicketSetupComplete["[P19-8] 設定完了 🟡P3"]
CheckCallTicketSetupRank -->|その他| NoCallTicketSetup[" "]

AdminOption --> AdminDashboard["[P22-3] 管理者画面 ⚪スキップ"]

BellIcon --> NotificationCenter["[P7-5] 通知センター 🟠P2"]
NotificationCenter --> MatchingRequestInbox["[P7-6] マッチング依頼受信履歴 🟠P2"]
NotificationCenter --> FootprintHistory["[P7-7] 足跡の履歴 🟠P2"]

MatchingRequestInbox --> MatchingRequestItem["[P7-8] マッチング依頼 (初メッセージ付き) 🟠P2"]
MatchingRequestItem --> AcceptOrReject{"[P7-9] 承諾 or 拒否? 🟠P2"}
AcceptOrReject -->|承諾| AcceptMatching["[P7-10] 承諾 → チャット開始 🟠P2"]
AcceptMatching --> AddToReplyCalc["[P3-9] 返信率計算対象に追加 (承諾数+1) 🔴P1"]
AddToReplyCalc --> Chat["[P8-1] チャット画面 🔴P1"]
AcceptOrReject -->|拒否 or 放置| RejectMatching["[P7-11] 拒否/放置 (7 日で期限切れ) 🟠P2"]
RejectMatching --> NotInCalc["[P3-10] 返信率計算対象外 🔴P1"]

BoostIcon --> BoostLogic["[P17-6] ブースト購入フロー 🟠P2"]
BoostLogic --> BoostPayment["[P17-7] 決済処理 (ブースト料金) 🟠P2"]
BoostPayment --> ActivateBoost["[P17-8] ブースト有効化 (30 分間) 🟠P2"]
ActivateBoost --> BoostEffects["[P17-9] 効果適用 🟠P2"]
BoostEffects --> DisplayPriority["[P3-11] 表示順位: 最上位 (Boost マーク付き / 30 分間) 🟠P2"]
BoostEffects --> CheckGenderBoost{"[P17-10] 性別判定 🟠P2"}
CheckGenderBoost -->|"男性"| CheckMaleRankBoost{"[P17-11] Rank 確認 🟠P2"}
CheckGenderBoost -->|"女性"| CheckFemaleRankBoost{"[P17-12] Rank 確認 🟠P2"}
CheckMaleRankBoost -->|"Rank1"| MaleMsgBoost1["[P17-13] 3 通/日 + 10 通 🟠P2"]
CheckMaleRankBoost -->|"Rank2"| MaleMsgBoost2["[P17-14] 5 通/日 + 10 通 🟠P2"]
CheckMaleRankBoost -->|"Rank3"| MaleMsgBoost3["[P17-15] 10 通/日 + 10 通 🟠P2"]
CheckMaleRankBoost -->|"Rank4-5"| MaleMsgBoost45["[P17-16] 無制限 🟠P2"]
CheckFemaleRankBoost -->|"Rank1"| FemaleMsgBoost1["[P17-17] 3 通/日 + 10 通 🟠P2"]
CheckFemaleRankBoost -->|"Rank2"| FemaleMsgBoost2["[P17-18] 10 通/日 + 10 通 🟠P2"]
CheckFemaleRankBoost -->|"Rank3 以上"| FemaleMsgBoost3["[P17-19] 無制限 🟠P2"]
MaleMsgBoost1 --> CheckBoostRestrictions{"[P17-20] 機能制限チェック 🟠P2"}
MaleMsgBoost2 --> CheckBoostRestrictions
MaleMsgBoost3 --> CheckBoostRestrictions
MaleMsgBoost45 --> CheckBoostRestrictions
FemaleMsgBoost1 --> CheckBoostRestrictions
FemaleMsgBoost2 --> CheckBoostRestrictions
FemaleMsgBoost3 --> CheckBoostRestrictions
CheckBoostRestrictions -->|ライブ配信試行| BlockLiveStream["[P17-21] × ブロック (事故防止) 🟠P2"]
CheckBoostRestrictions -->|ファンクラブ開設試行| BlockFanclub["[P17-22] × ブロック (詐欺防止) 🟠P2"]
CheckBoostRestrictions -->|受信フィルター| RankFilterCheck["[P17-23] 相手の Rank 制限で拒否される 🟠P2"]
ActivateBoost --> BoostTimer["[P17-24] タイマー: 30 分後に自動解除 🟠P2"]
BoostTimer --> RevertToNormal["[P17-25] 通常状態に戻る (Rank1 の制限) 🟠P2"]

IconFramePurchase --> FramePurchase["[P2-6] アイコンフレーム購入フロー 🟠P2"]
FramePurchase --> FramePayment["[P14-5] 決済処理 🟠P2"]
FramePayment --> FrameDBItem["[P2-7] 在庫付与 🟠P2"]
FrameDBItem --> FrameApply["[P2-8] プロフィールに適用 🟠P2"]

MonthlySettlement --> AggregateRevenue["[P20-2] 月次売上集計 🟡P3"]
AggregateRevenue --> BreakdownRevenue["[P20-3] 収入元別に集計 🟡P3"]
BreakdownRevenue -->|ファンクラブ加入| FCCount["[P20-4] 加入者数 × 500 円 🟡P3"]
BreakdownRevenue -->|ギフト受け取り| GiftSum["[P20-5] 受け取ったギフト総額 🟡P3"]
BreakdownRevenue -->|通話チケット売上| TicketSum["[P20-6] 販売したチケット総額 🟡P3"]
BreakdownRevenue -->|ライブ投げ銭| TippingSum["[P20-7] 受け取った投げ銭総額 🟡P3"]
FCCount --> TotalMonthly["[P20-8] 月間売上合計 🟡P3"]
GiftSum --> TotalMonthly
TicketSum --> TotalMonthly
TippingSum --> TotalMonthly
TotalMonthly --> DeductCommission["[P20-9] 手数料 30% 控除 🟡P3"]
DeductCommission --> CreatorMonthlyRevenue["[P20-10] 70% がクリエーター収益 🟡P3"]
CreatorMonthlyRevenue --> MonthlyReceiverWallet["[P20-11] 作り手ウォレットへ反映 🟡P3"]
MonthlyReceiverWallet --> MonthlyAdminRevenue["[P20-12] 運営収益へ 🟡P3"]

Timeline --> Card["[P3-12] ユーザーカード 🔴P1"]
Timeline --> DisplayOrder["[P3-13] 表示順位ルール 🔴P1"]
DisplayOrder --> RankBoost["[P3-14] 表示: 最優先 (Boost中) 🟠P2"]
DisplayOrder --> RankGod["[P3-15] 表示: 次点(Rank5) 🔴P1"]
DisplayOrder --> RankHigh["[P3-16] 表示: その次(Rank4) 🔴P1"]
DisplayOrder --> RankMid["[P3-17] 表示: その次(Rank3) 🔴P1"]
DisplayOrder --> RankLow["[P3-18] 表示: 下位(Rank1-2) 🔴P1"]
RankBoost --> BoostMen["[P3-20] 男性 Boost中 (Rank不問) 🟠P2"]
RankBoost --> BoostWomen["[P3-21] 女性 Boost中 (Rank不問) 🟠P2"]
RankGod --> GodMen["[P3-22] 男性 Rank5 🔴P1"]
RankGod --> GodWomen["[P3-23] 女性 Rank5 🔴P1"]
RankHigh --> HighMen["[P3-24] 男性 Rank4 🟠P2"]
RankHigh --> HighWomen["[P3-25] 女性 Rank4 🟠P2"]
RankMid --> MidMen["[P3-26] 男性 Rank3 🟠P2"]
RankMid --> MidWomen["[P3-27] 女性 Rank3 🟠P2"]
RankLow --> LowMen["[P3-30] 男性 Rank1-2 🔴P1"]
RankLow --> LowWomen["[P3-31] 女性 Rank1-2 🔴P1"]
DisplayOrder --> ActiveOrder["[P3-32] 各順位帯の中ではアクティブユーザー順 🔴P1"]

RedeemMenu --> CheckRedeemRank{"[P21-2] 換金権限あり? 🟡P3"}
CheckRedeemRank -->|男性 Rank5 or 女性 Rank4-5| RedeemOption["[P21-3] 還元オプション (活性化) 🟡P3"]
CheckRedeemRank -->|その他| PopupRedeemBlocked["[P21-4] ポップアップ: 条件ランクで換金可能\n ランク条件を見る 🟡P3"]
PopupRedeemBlocked --> RankHelpRedeem["[P21-5] ランク条件ヘルプ (昇格条件) 🟡P3"]
RedeemOption --> RedeemProcess["[P21-6] 換金処理 🟡P3"]
RedeemProcess --> CheckRedeemRate{"[P21-7] 換金率判定 🟡P3"}
CheckRedeemRate -->|女性 Rank4 or 男性 Rank5| Rate50["[P21-8] 換金率 50% 🟡P3"]
CheckRedeemRate -->|女性 Rank5| Rate70["[P21-9] 換金率 70% 🟡P3"]
Rate50 --> TransferUser50["[P21-10] 50% をユーザー口座へ振込 🟡P3"]
Rate70 --> TransferUser70["[P21-11] 70% をユーザー口座へ振込 🟡P3"]
TransferUser50 --> TransferAdmin50["[P21-12] 50% を運営口座へ 🟡P3"]
TransferUser70 --> TransferAdmin70["[P21-13] 30% を運営口座へ 🟡P3"]

AdminDashboard --> AdminAccount["[P22-4] 運営口座情報登録 ⚪スキップ"]
AdminDashboard --> AdminDebug["[P22-5] デバッグ機能 ⚪スキップ"]
AdminDashboard --> AdminBan["[P22-6] 迷惑ユーザー追放 ⚪スキップ"]
AdminDashboard --> AdminDeleteAccount["[P22-7] ユーザー口座情報削除 ⚪スキップ"]
AdminDashboard --> AdminRedeemRate["[P22-8] 還元率管理 (50% / 70% 設定) ⚪スキップ"]

subgraph Ranks [ランク概要]
subgraph Male [男性ランク - 詳細: male.tsv]
M1["Rank1 メッセージ 3/日 🔴P1<br>【昇格】本人確認 + 返信率 80%+ + 会 5+<br>【降格】返信率 60%未満（30 日継続）"]
M2["Rank2 メッセージ 5/日 🟠P2<br>【昇格】返信率 85%+ + 会 10+ + レビュー 3.5+<br>【降格】返信率 70%未満（30 日継続）"]
M3["Rank3 メッセージ 10/日 🟠P2<br>【昇格】返信率 90%+ + 会 20+ + レビュー 4.0+<br>【降格】返信率 75%未満（30 日継続）"]
M4["Rank4 無制限 🟠P2<br>【昇格】返信率 90%+ + 会 50+ + レビュー 4.5+ + マナー 100 点<br>【降格】返信率 80%未満（30 日継続）"]
M5["Rank5 無制限 + ライブ/ファンクラブ 🟡P3<br>【降格】返信率 85%未満（30 日継続） OR レビュー 4.5 未満"]
end
subgraph Female [女性ランク - 詳細: female.tsv]
F1["Rank1 メッセージ 3/日 🔴P1<br>【昇格】本人確認 + 返信率 80%+ + 会 5+<br>【降格】返信率 60%未満（30 日継続）"]
F2["Rank2 メッセージ 10/日 🟠P2<br>【昇格】返信率 85%+ + 会 10+ + レビュー 3.5+<br>【降格】返信率 70%未満（30 日継続）"]
F3["Rank3 無制限 + ギフト受取 🟠P2<br>【昇格】返信率 90%+ + 会 20+ + レビュー 4.0+<br>【降格】返信率 75%未満（30 日継続）"]
F4["Rank4 優先表示 + 換金(50%) 🟠P2<br>【昇格】返信率 90%+ + 会 50+ + レビュー 4.5+ + マナー 100 点<br>【降格】返信率 80%未満（30 日継続）"]
F5["Rank5 全権限 + 換金(70%) 🟡P3<br>【降格】返信率 85%未満（30 日継続） OR レビュー 4.5 未満"]
end
end
M1 --> M2 --> M3 --> M4 --> M5
F1 --> F2 --> F3 --> F4 --> F5

Timeline --> M1
Timeline --> F1
PostVerify --> CheckHistory

classDef warn fill:#3f000f,stroke:#f87171,color:#fff
class ErrNotClose,Cancelled warn
