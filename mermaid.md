(1) チャット画面 & リスト
%%{init: {'theme': 'dark'}}%%
sequenceDiagram
participant User as ユーザー
participant App as アプリ画面
participant API as Backend API
participant DB as Database

    User->>App: ユーザー詳細から「メッセージ」タップ
    App->>API: GET /chat/{partner_id}/messages
    API->>DB: 2人の会話履歴を検索
    DB-->>API: 履歴データ
    API-->>App: JSONデータ
    App->>User: チャット画面表示

    User->>App: メッセージ送信
    App->>API: POST /messages
    API->>DB: メッセージ保存(Insert)
    DB-->>API: 完了
    API-->>App: 自分の画面に吹き出し追加

(2) 約束作成フロー
%%{init: {'theme': 'dark'}}%%
sequenceDiagram
participant User as ユーザー(A)
participant App as アプリ
participant API as Backend API

    User->>App: チャット内の「＋」ボタン → 「約束する」
    App->>User: 日時・場所入力モーダル表示
    User->>App: 入力して「決定」

    App->>API: POST /meet_requests (日時, 場所)
    API-->>App: request_id 返却

    App->>App: チャット画面に「約束チケット」を表示
    Note over App: 相手(B)の画面にも<br>チケットが表示される

(3) チケット UI & QR 表示 (モック)
%%{init: {'theme': 'dark'}}%%
flowchart TD
Start["チャット画面を開く"] --> CheckStatus{"約束データがある？"}

    CheckStatus -- No --> NormalChat["通常のチャット画面"]
    CheckStatus -- Yes --> ShowTicket["上部に「チケット」表示"]

    ShowTicket --> CheckTime{"現在は約束の時間？"}

    CheckTime -- まだ --> DisabledBtn["QRボタン: グレーアウト<br>「まだ時間ではありません」"]
    CheckTime -- 当日/時間内 --> ActiveBtn["QRボタン: 点灯<br>「チェックインする」"]

    ActiveBtn --> Click["クリック"]
    Click --> ShowQR["QRコードを表示<br>(request_idを含んだデータ)"]

(4) スキャン & ランク変動
%%{init: {'theme': 'dark'}}%%
sequenceDiagram
participant Scanner as スキャンする側(A)
participant API as Backend API
participant DB as Database

    Scanner->>Scanner: カメラでQRを読み取る
    Note right of Scanner: QR内容: { request_id: 123 }

    Scanner->>API: POST /verify (request_id: 123)

    API->>DB: MeetRequestを「完了」に更新
    API->>DB: AとBの「会った回数」を加算 (+1)
    API->>DB: ランク再計算ロジック実行

    API-->>Scanner: 成功レスポンス
    Scanner->>Scanner: 「認証成功！楽しんで！」アラート表示

(5) 虚偽申告の排除（QR チェックイン基盤）
%%{init: {'theme': 'dark'}}%%
sequenceDiagram
participant A as A さん(評価する側)
participant App as アプリ(システム)
participant B as B さん(評価される側)

    Note over A,B: アプリ上で会う約束が成立済み

    rect rgb(30, 41, 59)
        Note over A,B: 【当日】待ち合わせ場所に到着
        B->>App: 「チェックイン」ボタンを押す
        App-->>B: ワンタイムQRコードを表示

        A->>App: 「スキャンする」ボタンを押す
        A->>B: スマホをかざしてBのQRを読み取る
    end

    rect rgb(15, 23, 42)
        Note over App: ⚡️ システム判定 ⚡️
        App->>App: 正しいQRか検証
        App->>App: 「会った事実」をDBに確定保存
        App-->>A: 認証成功！楽しんでください
        App-->>B: 認証成功！ランク維持条件クリア
    end

    Note over A,B: 〜 デート中 〜

    rect rgb(51, 65, 85)
        Note over A,B: 【解散後】レビュータイム
        A->>App: 「つまらなかった」と入力(★1)

        Note over App: 処理分岐
        App->>B: ランク維持カウント → 加算 (+1) ✅
        App->>B: 評価点(★) → 減少 (平均値ダウン) ⤵️
    end

(6) 不正スキャン防止（GPS & ワンタイム QR）
%%{init: {'theme': 'dark'}}%%
sequenceDiagram
participant A as A さん(QR 出す)
participant Server as サーバー
participant B as B さん(スキャン)

    Note over A, B: 【不正対策】遠隔地からのスキャン防止

    A->>A: QR表示ボタン押下
    A->>Server: QRリクエスト + 位置情報(GPS)

    Server->>Server: エリア内か判定(博多駅半径500m)
    alt エリア外
        Server-->>A: エラー「目的地に到着していません」
    else エリア内
        Server-->>A: ワンタイムトークン発行(有効30秒)
        A->>A: QRコード表示
    end

    Note right of A: スクショを送っても<br>30秒で無効になる

    B->>B: カメラ起動
    B->>B: AのQRをスキャン
    B->>Server: トークン送信 + Bの位置情報(GPS)

    Server->>Server: トークン有効期限 & Bの位置チェック
    alt Bがエリア外 or トークン切れ
        Server-->>B: 認証失敗！
    else 条件クリア
        Server-->>B: 会う約束 完了！
    end

(7) ランク稼ぎ対策（結託防止）
%%{init: {'theme': 'dark'}}%%
flowchart TD
Start["QR スキャン完了"] --> CheckHistory{"過去にこの相手と<br>会った回数は？"}

    CheckHistory -- "0回 (初対面)" --> FullScore["ランクポイント<br>100% 加算"]
    CheckHistory -- "1回 (2回目)" --> LowScore["ランクポイント<br>10% 加算<br>(微増)"]
    CheckHistory -- "2回以上" --> NoScore["ランクポイント<br>加算なし<br>(純粋なデート)"]

    FullScore --> End["処理完了"]
    LowScore --> End
    NoScore --> End

(8) チャット機能のリアル化（Socket 通信またはポーリング）
sequenceDiagram
autonumber
participant Sender as 送信者 (自分)
participant AppSender as アプリ (自分)
participant Server as サーバー (DB)
participant AppReceiver as アプリ (相手)
participant Receiver as 受信者 (相手)

    Note over AppSender, AppReceiver: 💬 チャット画面を開いている状態

    rect rgb(30, 60, 90)
        Note over Sender, Server: 📤 送信フロー (高コントラスト青)
        Sender->>AppSender: メッセージ入力 & 送信
        AppSender->>Server: POST /messages
        Server->>Server: DBに保存 (Insert)
        Server-->>AppSender: 200 OK
        AppSender->>Sender: 自分の画面に吹き出し追加
    end

    rect rgb(40, 70, 40)
        Note over AppReceiver, Server: 📥 受信フロー (ポーリング / 高コントラスト緑)

        loop 3秒ごとに自動実行
            AppReceiver->>Server: GET /chat/{id}/messages
            Server->>Server: DBから履歴を取得

            alt 新着メッセージあり
                Server-->>AppReceiver: [ {id: 101, text: "こんにちは", ...} ]
                AppReceiver->>Receiver: 画面更新 (相手の吹き出し表示)
            else 新着なし
                Server-->>AppReceiver: [] (空配列)
                AppReceiver->>AppReceiver: 何もしない
            end
        end
    end

(10)疑惑を生まない「期限切れフロー」
%%{init: {'theme': 'dark'}}%%
sequenceDiagram
participant Sender as 送信者(男性)
participant System as サーバー
participant Receiver as 受信者(女性)

    Sender->>System: 💌 メッセージ送信
    System->>Receiver: リクエスト箱に追加

    Note right of Receiver: 好みじゃないので放置(保留)

    loop 7日間
        Sender->>System: 既読ついたかな？
        System-->>Sender: ステータス: 「リクエスト送信中(未読)」
        Note left of Sender: まだ見てないだけか...<br>(サクラならすぐ食いつくはずだしな)
    end

    rect rgb(15, 23, 42)
        Note over System: ⏳ 7日経過 (タイムアウト)
        System->>System: リクエストを削除
        System-->>Sender: ⚠️ 通知「リクエストの有効期限が切れました」
    end

    Note left of Sender: 残念、縁がなかったか。<br>でも「無視」されたわけじゃないし、<br>次行こう！(サクラではないと判断)

(11) マッチング依頼の状態遷移（7 日期限切れで戻す）
%%{init: {'theme': 'dark'}}%%
flowchart TD
A[マッチング依頼を送信] --> B["ボタン状態: 『依頼中』"]
B --> C{チェック実行<br>相手の承諾確認<br>または<br>7 日経過確認}

    C -- 相手が承諾 --> D["ボタン状態: 『マッチング中』"]
    D --> E["メールアイコン表示<br>クリックでチャット開く"]

    C -- 相手が承諾しない --> F["ボタン状態戻す: 『マッチングを依頼』"]
    C -- 7日経過 --> F

    F --> G["状態: 通常に戻る<br>(再度依頼可能)"]

    style F fill:#4c1d95,stroke:#c084fc,stroke-width:2px

(12) チケット表示フロー
%%{init: {'theme': 'dark'}}%%
sequenceDiagram
participant User as ユーザー
participant App as アプリ画面
participant Server as サーバー

    User->>App: 「受信箱」から確定したデートを選択
    App->>Server: チケット情報を要求

    rect rgb(30, 41, 59)
        Note over Server: 🕒 時間チェック

        alt まだデート前日より前
            Server-->>App: ステータス: "upcoming"<br>（QRコードなし）
            App->>User: 🎟 チケット表示<br>「QRコードは前日に表示されます」
        else デート当日/前日
            Server-->>App: ステータス: "ready"<br>（QRコード発行済み）
            App->>User: 🎟 チケット表示<br>QRコードを表示 🏁
        end
    end

(13) スキャンから完了までのフロー
sequenceDiagram
autonumber
participant ShowUser as A さん (QR 見せる)
participant Server as サーバー
participant ScanUser as B さん (スキャンする)

    Note over ShowUser: 🎟 チケット画面で<br>「現地でチェックイン」ボタン押下
    ShowUser->>Server: 位置情報送信 & チェックイン
    Server-->>ShowUser: OK (QRコード表示許可)
    ShowUser->>ShowUser: QRコード表示 (Token入り)

    Note over ScanUser: 📍 デート相手と合流

    ScanUser->>ScanUser: スキャン画面起動 (カメラ)
    ScanUser->>ShowUser: AさんのスマホのQRを読み取る 📸

    ScanUser->>Server: 📡 POST /verify (Token送信)

    rect rgb(80, 70, 20)
        Note over Server: 🕵️‍♀️ 検証プロセス (サーバー内部 / 警告色)
        Server->>Server: トークンの有効期限チェック
        Server->>Server: 待ち合わせデータのステータスを<br>「completed (完了)」に更新
        Server->>Server: 双方の「会った回数」を +1 加算 🆙
        Server-->>ScanUser: 認証成功レスポンス
    end

    ScanUser->>ScanUser: 画面が「認証成功！」に切り替わる

    par 双方への反映
        ScanUser->>ScanUser: 「⭐️ レビューを書く」ボタン出現

        Note right of ShowUser: Aさんは画面リロード等の<br>タイミングで反映
        ShowUser->>Server: (次回のデータ取得時)
        Server-->>ShowUser: status: completed
        ShowUser->>ShowUser: Aさんの画面も「完了」に変化 ✅
    end

(14) アイコンリング購入と適用
%%{init: {'theme': 'dark'}}%%
sequenceDiagram
participant User as ユーザー
participant Shop as アイテムショップ
participant DB as Database
participant UI as プロフィール画面

    User->>Shop: アイコンリング購入画面へ

    rect rgb(15, 23, 42)
        Note over User, Shop: 課金フロー
        alt 通常購入
            User->>Shop: 1個購入 (500円)
            Shop->>DB: 決済処理 & アイテム付与
        else チケット購入 (お得)
            User->>Shop: 5個チケット購入 (2000円)
            Shop->>DB: 決済 & チケット在庫+5
        end
    end

    User->>UI: 「アイテムを使う」選択

    alt チケット利用の場合
        UI->>DB: チケット在庫確認 (>0)
        DB-->>UI: OK
        UI->>DB: 在庫消費 (-1) & リング有効化
    end

    DB-->>UI: 装備完了
    UI->>User: アバターにリングが表示される

(15) ファンクラブ・投げ銭システム
%%{init: {'theme': 'dark'}}%%
flowchart TD
subgraph Giver ["ファン(一般ユーザー)"]
Pay[投げ銭 / 月額加入]
end

    subgraph Platform [ESNS運営プラットフォーム]
        Commission["手数料 30% 徴収<br>(あなたの収益)"]
        Pool[収益プール]
    end

    subgraph Receiver [高ランクユーザー]
        Wallet[売上残高]
        Privilege["ファン限定特典の提供<br>(裏チャット/優先返信)"]
    end

    Pay -->|1000円| Commission
    Commission -->|300円| Pool
    Commission -->|700円| Wallet

    Wallet -->|出金申請| Bank[銀行口座へ振込]

    Pay -.->|加入| Privilege
    Privilege -.->|提供| Giver

(16) プレミアム会員（ランク連動型制限）
%%{init: {'theme': 'dark'}}%%
sequenceDiagram
participant User as ユーザー
participant App as アプリ(制限判定)
participant Sub as サブスク管理
participant DB as Database

    User->>App: メッセージ送信を試みる

    rect rgb(30, 41, 59)
        Note over App, DB: 送信可否チェックフロー
        App->>DB: ① プレミアム会員か確認
        DB-->>App: No (無料会員)

        App->>DB: ② 現在のランクと、今日の送信数を取得
        DB-->>App: Rank 1 (上限3通) / 今日既に3通送信済み
    end

    alt 制限オーバー
        App-->>User: ⛔️ 制限「ランク1の無料枠(3通)を超えました」
        App-->>User: 💡 提案「会ってランクを上げるか、プレミアム(980円)で無制限にしますか？」

        opt 課金する場合
            User->>App: 「プレミアムに登録」
            App->>Sub: 決済処理
            Sub-->>App: 成功
            App-->>User: 🎉 制限解除！送信完了
        end
    else 範囲内 or プレミアム or 高ランク
        App->>DB: メッセージ保存
        App-->>User: 送信成功
    end

(17) SNS シェア・診断結果拡散機能
%%{init: {'theme': 'dark'}}%%
sequenceDiagram
participant User as 既存ユーザー
participant App as アプリ
participant SNS as Twitter/Instagram
participant NewUser as 新規ユーザー

    Note over User: 自分のランクを確認

    User->>App: 「ランクをシェアする」ボタン
    App->>App: シェア用画像を生成
    Note right of App: ・現在のランク(★4)<br>・アバター画像<br>・「#ESNSで市場価値診断」

    App->>SNS: シェア画面(OS標準)を起動
    User->>SNS: 投稿する

    Note over SNS: タイムラインに拡散される

    NewUser->>SNS: 投稿を見る
    NewUser->>SNS: 「何これ？」とリンクをクリック
    SNS->>NewUser: アプリストアへ誘導

    NewUser->>App: 新規インストール

(18)「女神定着ループ」の設計図
%%{init: {'theme': 'dark'}}%%
graph TD
User((ランク 5 女子))

    subgraph ESNSの沼
        Income["💰 毎月のファンクラブ収入<br>(やめると0円)"]
        Status["👑 女神待遇・ログイン通知<br>(他では味わえない快感)"]
        Comfort["🛡 雑魚ブロック機能<br>(ストレスなし)"]
    end

    User -->|享受| Income
    User -->|享受| Status
    User -->|享受| Comfort

    Income -.->|退会抑止| User
    Status -.->|承認欲求| User
    Comfort -.->|居心地| User

    OtherApp[他のマッチングアプリ]

    User -- 比較 --> OtherApp
    OtherApp -->|稼げない/ウザい| Return[ESNSに戻ってくる]

(19)男神定着ループ (粗品モデル)
%%{init: {'theme': 'dark'}}%%
graph TD
User((ランク 5 男神))

    subgraph 武器["（集客）"]
        Live["🎙 ライブ配信<br>(俺の価値をアピールする場所)"]
    end

    subgraph 収益源["（キャッシュポイント）"]
        TimeSale["📞 通話チケット販売<br>(粗品モデル: ライブ中に販売)"]
        FanClub["⭐️ ファンクラブ<br>(太客の証明書・月額収入)"]
        Filter["🛡 貢ぎフィルター<br>(選民意識の維持)"]
    end

    User -->|実施| Live
    Live -->|誘導| TimeSale
    Live -->|誘導| FanClub

    TimeSale -.->|高額単発収入| User
    FanClub -.->|安定継続収入| User
    Filter -.->|快適な環境| User

(21)男性ユーザーの昇格ロードマップ（The Path to King）
%%{init: {'theme': 'dark'}}%%
flowchart TD
subgraph Rank1 ["Rank 1: 新参者 (一般兵)"]
Privilege1["❌ 制限: メッセージ 1 日 3 通<br>❌ 検索: 地域のみ (Premium+Boost で全項目)"]
Condition1("▼ 昇格条件 ▼<br>・本人確認書類の提出 (必須)<br>・返信率 80%以上<br>・会った回数: 5 回以上")
end

    subgraph Rank2 ["Rank 2: 認証済み (正規兵)"]
          Privilege2["✅ 制限: メッセージ1日5通<br>✅ 検索: 地域+年齢 (Premium+Boost で全項目)"]
          Condition2("▼ 昇格条件 ▼<br>・返信率 85%以上<br>・会った回数: 10 回以上<br>・レビュー平均: 3.5 以上")
    end

    subgraph Rank3 ["Rank 3: 常連 (騎士)"]
        Privilege3["✅ 制限: メッセージ1日10通<br>✅ 機能: 足あと閲覧(直近3人)<br>✅ 検索: 詳細検索(年齢/ランク/目的/地域)"]
        Condition3("▼ 昇格条件 ▼<br>・返信率 90%以上<br>・会った回数: 20 回以上<br>・レビュー平均: 4.0 以上")
    end

    subgraph Rank4 ["Rank 4: エリート (貴族)"]
        Privilege4["⭐️ 制限: メッセージ無制限<br>⭐️ 機能: 優先表示<br>⭐️ 権限: Rank5申請権"]
        Condition4["(▼ 昇格条件 (狭き門) ▼<br>・レビュー平均: 4.5以上<br>・会った回数: 50 回以上<br>・マナー点: 最高 (100点)"]
    end

    subgraph Rank5 ["Rank 5: 男神 (王)"]
        Privilege5["👑 全権限解放<br>🎙 ライブ配信・通話チケット販売権<br>🛡 貢ぎフィルター利用権<br>💰 ファンクラブ開設権"]
    end

    Rank1 --> Condition1 --> Rank2
    Rank2 --> Condition2 --> Rank3
    Rank3 --> Condition3 --> Rank4
    Rank4 --> Condition4 --> Rank5

(22)女性ユーザーの昇格ロードマップ（The Path to Queen）
%%{init: {'theme': 'dark'}}%%
flowchart TD
subgraph Rank1 ["Rank 1: 新参者 (村娘)"]
Privilege1_F["❌ 制限: メッセージ 1 日 3 通<br>❌ 検索: 地域のみ (Premium+Boost で全項目)<br>❌ 受信: 全員から来る"]
Condition1_F("▼ 昇格条件 ▼<br>・本人確認書類の提出 (必須)<br>・返信率 80%以上<br>・会った回数: 5 回以上")
end

    subgraph Rank2 ["Rank 2: 認証済み (看板娘)"]
          Privilege2_F["✅ 制限: メッセージ1日10通<br>✅ 受信: Rank2以上のみ許可設定可<br>✅ 検索: 地域+年齢 (Premium+Boost で全項目)"]
          Condition2_F("▼ 昇格条件 ▼<br>・返信率 85%以上<br>・会った回数: 10 回以上<br>・レビュー平均: 3.5 以上")
    end

    subgraph Rank3 ["Rank 3: 人気会員 (アイドル)"]
        Privilege3_F["✅ 制限: メッセージ無制限<br>✅ 機能: ギフト受取解禁<br>✅ 検索: 詳細検索(年齢/ランク/目的/地域)"]
        Condition3_F("▼ 昇格条件 ▼<br>・返信率 90%以上<br>・会った回数: 20 回以上<br>・レビュー平均: 4.0 以上")
    end

    subgraph Rank4 ["Rank 4: 港区女子級 (姫)"]
        Privilege4_F["⭐️ 受信: Rank4以上限定フィルター<br>⭐️ 機能: プロフィール優先表示<br>⭐️ 収益: 換金 50%"]
        Condition4_F["(▼ 昇格条件 (選ばれし者) ▼<br>・レビュー平均: 4.5以上<br>・会った回数: 50 回以上<br>・マナー点: 最高 (100点)"]
    end

    subgraph Rank5 ["Rank 5: 女神 (女王)"]
        Privilege5_F["👑 全権限解放<br>🎙 ライブ配信権限<br>💰 ファンクラブ開設権<br>✨ ログイン時の全画面通知<br>💰 投げ銭換金(高)"]
    end

    Rank1 --> Condition1_F --> Rank2
    Rank2 --> Condition2_F --> Rank3
    Rank3 --> Condition3_F --> Rank4
    Rank4 --> Condition4_F --> Rank5

(23)返信率算出ロジックのフローチャート
%%{init: {'theme': 'dark'}}%%
flowchart TD
Sender[送信者 A] -->|メッセージ送信| Filter{受信フィルター判定}

    Filter -- ブロック対象 --> Trash[ゴミ箱]
    NoteTrash["❌ 計算対象外"]
    Trash -.- NoteTrash

    Filter -- 通過 --> RequestBox[メッセージリクエスト箱]
    NoteBox["📥 ここに溜まる<br>(男女共通)"]
    RequestBox -.- NoteBox

    subgraph ReceiverAction [受信者 B のアクション]
        RequestBox -->|放置・保留| Pending[保留状態]
        NotePending["❌ 計算対象外<br>(97通はここで待機)"]
        Pending -.- NotePending

        RequestBox -->|承認して返信| ChatStart[チャット成立]
        NoteChat["✅ ここから計算開始！<br>(3通分だけ計算)"]
        ChatStart -.- NoteChat
    end

    ChatStart -->|その後返信を続ける| ScoreUp[返信率 UP ⤴️]
    ChatStart -->|承認後に既読スルー| ScoreDown[返信率 DOWN ⤵️]

(24)ブーストの新しいロジック
%%{init: {'theme': 'dark'}}%%
flowchart TD
subgraph Users [ユーザープール]
U1[A さん: 真の Rank 5]
U2[B さん: 真の Rank 5]
U3[C さん: Rank 1 + ブースト中 🚀]
U4["D さん: Rank 2 (一般)"]
end

    subgraph SortLogic [表示順位の決定ロジック]
        Direction[並び替え実行]

        Priority1[① Boost中]
        Priority2[② Rank5]
        Priority3[③ Rank4]
        Priority4[④ Rank3]
        Priority5[⑤ Rank1-2]
    end

    U3 --> Priority1
    U1 --> Priority2
    U2 --> Priority2

    NoteBox["Boost中のユーザーが30分間だけ最上位に表示される。<br>表示ラベルは『Boost』のまま。<br>各順位帯の中ではアクティブユーザー順で並ぶ。"]
    Priority1 -.- NoteBox

    U4 --> Priority5

    subgraph PrivilegeCheck ["権限チェック (クリック後)"]
        Click1[Aさんをクリック] --> AllowLive[ライブ視聴OK<br>ファンクラブOK]
        Click2[Cさんをクリック] --> DenyLive[ライブボタン非表示<br>ファンクラブ非表示]
    end

(25)悪魔の囁きフロー（機会損失による課金誘導）
%%{init: {'theme': 'dark'}}%%
sequenceDiagram
participant User as 超モテる Rank1 ユーザー
participant App as アプリ画面
participant Logic as 制限システム
participant DB as Database

    Note over User, DB: 登録初日：100人からメッセージが届く！

    User->>App: リクエスト箱を開く
    App-->>User: バッジ表示「💌 99+件のリクエスト」
    Note right of User: 承認欲求 MAX！😍<br>「俺(私)って人気者！」

    rect rgb(30, 41, 59)
        Note over User, Logic: 【無料枠】3人だけ承認・返信
        User->>App: 1人目承認 & 返信
        Logic->>DB: カウント 1/3
        User->>App: 2人目承認 & 返信
        Logic->>DB: カウント 2/3
        User->>App: 3人目承認 & 返信
        Logic->>DB: カウント 3/3 (打止)
    end

    User->>App: 4人目(超タイプ)を承認しようとする！！

    rect rgb(69, 10, 10)
        Logic->>App: ⛔️ STOP指令 (Limit Reached)
        App-->>User: 😈 悪魔の囁き(モーダル表示)

        Note over App: 画面暗転 & ポップアップ<br>「もったいない！<br>あと97人があなたを待っています。<br>今すぐ制限を解除しますか？」
    end

    alt 課金で解決 (早急な欲望)
        User->>App: 🔘「プレミアム会員(980円)になる」
        App->>DB: ステータス更新: Premium
        Logic-->>App: 🔓 全解除 (Unlimited)
        App-->>User: 🎉「全員と話し放題です！」
    else 努力で解決 (堅実な一歩)
        User->>App: 🔘「本人確認してRank2になる」
        App->>DB: 書類提出 -> 承認 -> Rank 2
        Logic-->>App: 🔓 上限緩和 (3通 -> 5通)
        App-->>User: 「あと2人送れます！次はRank3を目指そう」
    end

(26) トラブル処理（通報 & 遅延）
%%{init: {'theme': 'dark'}}%%
stateDiagram-v2
state "待ち合わせ中" as Waiting
state "通報済み(緊急モード)" as Reported
state "合流完了(ペナルティあり)" as VerifiedPenalty
state "不成立(ドタキャン確定)" as Cancelled

    Waiting --> Reported : Bが「相手が来ない/スキャン拒否」通報

    Reported --> VerifiedPenalty : Aが慌ててスキャン実行
    Reported --> Cancelled : 一定時間経過(A反応なし)

    note right of VerifiedPenalty
        ・「会った回数」は加算される
        ・隠しパラメータ「マナー点」減点
        ・Bのレビュー画面に「トラブル報告」欄出現
    end note