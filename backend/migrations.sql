"""
Alembic migration file for Phase 1 & Phase 2 database schema
Generated from database_design.md

To use this migration:
1. Place this file in migrations/versions/
2. Run: alembic upgrade head
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers - Phase 1
revision = '001_initial_p1_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    """Create Phase 1 tables"""
    
    # 1. users テーブル
    op.create_table(
        'users',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('gender', sa.String(10), nullable=False),
        sa.Column('phone_number', sa.String(20), nullable=False),
        sa.Column('email', sa.String(255)),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('last_login', sa.DateTime()),
        sa.Column('status', sa.String(20), server_default='active'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('phone_number'),
        sa.UniqueConstraint('email')
    )
    op.create_index('idx_users_created_at', 'users', ['created_at'])
    
    # 2. user_profiles テーブル
    op.create_table(
        'user_profiles',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        sa.Column('display_name', sa.String(50)),
        sa.Column('age', sa.Integer()),
        sa.Column('location', sa.String(100)),
        sa.Column('bio', sa.Text()),
        sa.Column('avatar_url', sa.String(255)),
        sa.Column('icon_frame_id', sa.Integer()),
        sa.Column('last_updated', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index('idx_user_profiles_location', 'user_profiles', ['location'])
    op.create_index('idx_user_profiles_display_name', 'user_profiles', ['display_name'])
    
    # 3. user_ranks テーブル
    op.create_table(
        'user_ranks',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        sa.Column('current_rank', sa.Integer(), server_default='1'),
        sa.Column('meets_count', sa.Integer(), server_default='0'),
        sa.Column('reply_rate', sa.Numeric(5, 2), server_default='0'),
        sa.Column('review_avg', sa.Numeric(3, 2), server_default='0'),
        sa.Column('manner_points', sa.Integer(), server_default='100'),
        sa.Column('last_rank_update', sa.DateTime(), nullable=False),
        sa.Column('promoted_at', sa.DateTime()),
        sa.Column('demoted_at', sa.DateTime()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    
    # 4. matching_replies テーブル
    op.create_table(
        'matching_replies',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        sa.Column('accepted_count', sa.Integer(), server_default='0'),
        sa.Column('replied_count', sa.Integer(), server_default='0'),
        sa.Column('period_date', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'period_date', name='uq_user_period')
    )
    op.create_index('idx_matching_replies_user_id', 'matching_replies', ['user_id'])
    
    # 5. matching_requests テーブル
    op.create_table(
        'matching_requests',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('requester_id', sa.BigInteger(), nullable=False),
        sa.Column('recipient_id', sa.BigInteger(), nullable=False),
        sa.Column('initial_message', sa.Text(), nullable=False),
        sa.Column('status', sa.String(20), server_default='pending'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('responded_at', sa.DateTime()),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['requester_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['recipient_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_requester_created', 'matching_requests', ['requester_id', 'created_at'])
    op.create_index('idx_recipient_status', 'matching_requests', ['recipient_id', 'status'])
    
    # 6. chat_messages テーブル
    op.create_table(
        'chat_messages',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('matching_id', sa.BigInteger(), nullable=False),
        sa.Column('sender_id', sa.BigInteger(), nullable=False),
        sa.Column('message_text', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('is_read', sa.Boolean(), server_default='false'),
        sa.ForeignKeyConstraint(['matching_id'], ['matching_requests.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_matching_created', 'chat_messages', ['matching_id', 'created_at'])
    
    # 7. meet_requests テーブル
    op.create_table(
        'meet_requests',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('matching_id', sa.BigInteger(), nullable=False),
        sa.Column('proposer_id', sa.BigInteger(), nullable=False),
        sa.Column('respondent_id', sa.BigInteger(), nullable=False),
        sa.Column('scheduled_at', sa.DateTime(), nullable=False),
        sa.Column('status', sa.String(20), server_default='pending'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('responded_at', sa.DateTime()),
        sa.Column('completed_at', sa.DateTime()),
        sa.Column('proposer_location', sa.JSON()),
        sa.Column('respondent_location', sa.JSON()),
        sa.ForeignKeyConstraint(['matching_id'], ['matching_requests.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['proposer_id'], ['users.id']),
        sa.ForeignKeyConstraint(['respondent_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_respondent_status', 'meet_requests', ['respondent_id', 'status'])
    op.create_index('idx_scheduled', 'meet_requests', ['scheduled_at'])
    
    # 8. qr_tokens テーブル
    op.create_table(
        'qr_tokens',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('meet_request_id', sa.BigInteger(), nullable=False),
        sa.Column('token_hash', sa.String(255), nullable=False),
        sa.Column('issued_by_user_id', sa.BigInteger(), nullable=False),
        sa.Column('issued_at', sa.DateTime(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('verified_at', sa.DateTime()),
        sa.Column('verified_by_user_id', sa.BigInteger()),
        sa.Column('is_used', sa.Boolean(), server_default='false'),
        sa.ForeignKeyConstraint(['meet_request_id'], ['meet_requests.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['issued_by_user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['verified_by_user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('meet_request_id')
    )
    
    # 9. completed_meets テーブル
    op.create_table(
        'completed_meets',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('meet_request_id', sa.BigInteger(), nullable=False),
        sa.Column('user_a_id', sa.BigInteger(), nullable=False),
        sa.Column('user_b_id', sa.BigInteger(), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=False),
        sa.Column('is_reported', sa.Boolean(), server_default='false'),
        sa.ForeignKeyConstraint(['meet_request_id'], ['meet_requests.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_a_id'], ['users.id']),
        sa.ForeignKeyConstraint(['user_b_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('meet_request_id')
    )
    op.create_index('idx_user_a_completed', 'completed_meets', ['user_a_id', 'completed_at'])
    op.create_index('idx_user_b_completed', 'completed_meets', ['user_b_id', 'completed_at'])
    
    # 10. reviews テーブル
    op.create_table(
        'reviews',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('meet_id', sa.BigInteger(), nullable=False),
        sa.Column('reviewer_id', sa.BigInteger(), nullable=False),
        sa.Column('reviewed_user_id', sa.BigInteger(), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('comment', sa.Text()),
        sa.Column('points_multiplier', sa.Numeric(3, 2)),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['meet_id'], ['completed_meets.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reviewer_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reviewed_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('meet_id', 'reviewer_id', name='uq_meet_reviewer')
    )
    op.create_index('idx_reviewed_user_id', 'reviews', ['reviewed_user_id'])
    
    # 11. notifications テーブル
    op.create_table(
        'notifications',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('related_user_id', sa.BigInteger()),
        sa.Column('related_object_id', sa.BigInteger()),
        sa.Column('message', sa.Text()),
        sa.Column('is_read', sa.Boolean(), server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_user_created_at', 'notifications', ['user_id', 'created_at'])
    
    # 12. footprints テーブル
    op.create_table(
        'footprints',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('visitor_id', sa.BigInteger(), nullable=False),
        sa.Column('visited_user_id', sa.BigInteger(), nullable=False),
        sa.Column('visited_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['visitor_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['visited_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('visitor_id', 'visited_user_id', name='uq_visitor_visited')
    )
    op.create_index('idx_visited_user_visited_at', 'footprints', ['visited_user_id', 'visited_at'])


def downgrade():
    """Drop Phase 1 tables"""
    op.drop_table('footprints')
    op.drop_table('notifications')
    op.drop_table('reviews')
    op.drop_table('completed_meets')
    op.drop_table('qr_tokens')
    op.drop_table('meet_requests')
    op.drop_table('chat_messages')
    op.drop_table('matching_requests')
    op.drop_table('matching_replies')
    op.drop_table('user_ranks')
    op.drop_table('user_profiles')
    op.drop_table('users')


# ============================================================================
# Phase 2 (🟠P2) Migration
# ============================================================================

def upgrade_p2():
    """Create Phase 2 tables"""
    
    # 1. boost_purchases テーブル
    op.create_table(
        'boost_purchases',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        sa.Column('purchased_at', sa.DateTime(), nullable=False),
        sa.Column('activated_at', sa.DateTime()),
        sa.Column('expires_at', sa.DateTime()),
        sa.Column('price_jpy', sa.Integer(), nullable=False),
        sa.Column('payment_status', sa.String(20), server_default='pending'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_user_expires', 'boost_purchases', ['user_id', 'expires_at'])
    
    # 2. premium_subscriptions テーブル
    op.create_table(
        'premium_subscriptions',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=False),
        sa.Column('ends_at', sa.DateTime()),
        sa.Column('status', sa.String(20), server_default='active'),
        sa.Column('monthly_price_jpy', sa.Integer(), server_default='980'),
        sa.Column('last_charge_at', sa.DateTime()),
        sa.Column('next_charge_at', sa.DateTime()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index('idx_user_status', 'premium_subscriptions', ['user_id', 'status'])
    
    # 3. receive_filters テーブル
    op.create_table(
        'receive_filters',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        sa.Column('block_rank1', sa.Boolean(), server_default='false'),
        sa.Column('block_rank2', sa.Boolean(), server_default='false'),
        sa.Column('block_rank3', sa.Boolean(), server_default='false'),
        sa.Column('tribute_filter_enabled', sa.Boolean(), server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    
    # 4. icon_frames テーブル
    op.create_table(
        'icon_frames',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('image_url', sa.String(255), nullable=False),
        sa.Column('price_jpy', sa.Integer(), nullable=False),
        sa.Column('is_free', sa.Boolean(), server_default='false'),
        sa.Column('rarity', sa.String(20), server_default='common'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # 5. icon_frame_purchases テーブル
    op.create_table(
        'icon_frame_purchases',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        sa.Column('frame_id', sa.BigInteger(), nullable=False),
        sa.Column('purchased_at', sa.DateTime(), nullable=False),
        sa.Column('price_jpy', sa.Integer(), nullable=False),
        sa.Column('payment_status', sa.String(20), server_default='pending'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['frame_id'], ['icon_frames.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_user_purchased', 'icon_frame_purchases', ['user_id', 'purchased_at'])
    
    # 6. message_quotas テーブル
    op.create_table(
        'message_quotas',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        sa.Column('quota_date', sa.DateTime(), nullable=False),
        sa.Column('base_quota', sa.Integer(), nullable=False),
        sa.Column('boost_quota', sa.Integer(), server_default='0'),
        sa.Column('premium_quota', sa.Integer(), server_default='0'),
        sa.Column('used_count', sa.Integer(), server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'quota_date', name='uq_user_quota_date')
    )
    op.create_index('idx_message_quotas_user', 'message_quotas', ['user_id'])
    
    # 7. boost_display_logs テーブル
    op.create_table(
        'boost_display_logs',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        sa.Column('boost_id', sa.BigInteger()),
        sa.Column('display_rank', sa.String(20), nullable=False),
        sa.Column('display_position', sa.Integer()),
        sa.Column('start_time', sa.DateTime(), nullable=False),
        sa.Column('end_time', sa.DateTime(), nullable=False),
        sa.Column('impressions', sa.Integer(), server_default='0'),
        sa.Column('clicks', sa.Integer(), server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['boost_id'], ['boost_purchases.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_user_start_time', 'boost_display_logs', ['user_id', 'start_time'])


def downgrade_p2():
    """Drop Phase 2 tables"""
    op.drop_table('boost_display_logs')
    op.drop_table('message_quotas')
    op.drop_table('icon_frame_purchases')
    op.drop_table('icon_frames')
    op.drop_table('receive_filters')
    op.drop_table('premium_subscriptions')
    op.drop_table('boost_purchases')


# ============================================================================
# Phase 3 (P3) Migration Functions
# ============================================================================


def upgrade_p3():
    """Create Phase 3 tables (monetization)"""
    
    # 1. live_streams テーブル
    op.create_table(
        'live_streams',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('broadcaster_id', sa.BigInteger(), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=False),
        sa.Column('ended_at', sa.DateTime()),
        sa.Column('title', sa.String(255)),
        sa.Column('viewer_count', sa.Integer(), server_default='0'),
        sa.Column('status', sa.String(20), server_default='live'),
        sa.Column('total_tipping_jpy', sa.Integer(), server_default='0'),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['broadcaster_id'], ['users.id'], ondelete='CASCADE')
    )
    op.create_index('idx_broadcaster_started', 'live_streams', ['broadcaster_id', 'started_at'])
    
    # 2. fanclub_memberships テーブル
    op.create_table(
        'fanclub_memberships',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('member_id', sa.BigInteger(), nullable=False),
        sa.Column('creator_id', sa.BigInteger(), nullable=False),
        sa.Column('joined_at', sa.DateTime(), nullable=False),
        sa.Column('expires_at', sa.DateTime()),
        sa.Column('status', sa.String(20), server_default='active'),
        sa.Column('monthly_price_jpy', sa.Integer(), server_default='500'),
        sa.Column('next_charge_at', sa.DateTime()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['member_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['creator_id'], ['users.id']),
        sa.UniqueConstraint('member_id', 'creator_id', name='uq_member_creator')
    )
    op.create_index('idx_creator_joined', 'fanclub_memberships', ['creator_id', 'joined_at'])
    
    # 3. call_tickets テーブル
    op.create_table(
        'call_tickets',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('seller_id', sa.BigInteger(), nullable=False),
        sa.Column('ticket_duration_minutes', sa.Integer(), nullable=False),
        sa.Column('price_jpy', sa.Integer(), nullable=False),
        sa.Column('is_available', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['seller_id'], ['users.id'], ondelete='CASCADE')
    )
    op.create_index('idx_seller_available', 'call_tickets', ['seller_id', 'is_available'])
    
    # 4. call_ticket_purchases テーブル
    op.create_table(
        'call_ticket_purchases',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('buyer_id', sa.BigInteger(), nullable=False),
        sa.Column('ticket_id', sa.BigInteger(), nullable=False),
        sa.Column('seller_id', sa.BigInteger(), nullable=False),
        sa.Column('purchased_at', sa.DateTime(), nullable=False),
        sa.Column('used_at', sa.DateTime()),
        sa.Column('amount_jpy', sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['buyer_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['ticket_id'], ['call_tickets.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['seller_id'], ['users.id'])
    )
    op.create_index('idx_buyer_used', 'call_ticket_purchases', ['buyer_id', 'used_at'])
    op.create_index('idx_seller_used', 'call_ticket_purchases', ['seller_id', 'used_at'])
    
    # 5. gifts テーブル
    op.create_table(
        'gifts',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('sender_id', sa.BigInteger(), nullable=False),
        sa.Column('recipient_id', sa.BigInteger(), nullable=False),
        sa.Column('gift_item_id', sa.Integer(), nullable=False),
        sa.Column('sent_at', sa.DateTime(), nullable=False),
        sa.Column('received_at', sa.DateTime()),
        sa.Column('is_opened', sa.Boolean(), server_default='false'),
        sa.Column('price_jpy', sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['recipient_id'], ['users.id'], ondelete='CASCADE')
    )
    op.create_index('idx_recipient_received', 'gifts', ['recipient_id', 'received_at'])
    
    # 6. tipping_transactions テーブル
    op.create_table(
        'tipping_transactions',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('sender_user_id', sa.BigInteger(), nullable=False),
        sa.Column('recipient_user_id', sa.BigInteger(), nullable=False),
        sa.Column('live_stream_id', sa.BigInteger()),
        sa.Column('amount_jpy', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(20), server_default='completed'),
        sa.Column('occurred_at', sa.DateTime(), nullable=False),
        sa.Column('settled_at', sa.DateTime()),
        sa.Column('creator_revenue_jpy', sa.Integer()),
        sa.Column('platform_revenue_jpy', sa.Integer()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['sender_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['recipient_user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['live_stream_id'], ['live_streams.id'])
    )
    op.create_index('idx_recipient_occurred', 'tipping_transactions', ['recipient_user_id', 'occurred_at'])
    
    # 7. monthly_revenue テーブル
    op.create_table(
        'monthly_revenue',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        sa.Column('year_month', sa.String(7), nullable=False),
        sa.Column('boost_revenue_jpy', sa.Integer(), server_default='0'),
        sa.Column('premium_revenue_jpy', sa.Integer(), server_default='0'),
        sa.Column('fanclub_revenue_jpy', sa.Integer(), server_default='0'),
        sa.Column('gift_revenue_jpy', sa.Integer(), server_default='0'),
        sa.Column('tipping_revenue_jpy', sa.Integer(), server_default='0'),
        sa.Column('ticket_revenue_jpy', sa.Integer(), server_default='0'),
        sa.Column('total_revenue_jpy', sa.Integer(), server_default='0'),
        sa.Column('creator_payout_70_jpy', sa.Integer()),
        sa.Column('platform_payout_30_jpy', sa.Integer()),
        sa.Column('settled_at', sa.DateTime()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('user_id', 'year_month', name='uq_user_year_month')
    )
    
    # 8. user_statistics テーブル
    op.create_table(
        'user_statistics',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('date', sa.String(10), nullable=False),
        sa.Column('dau', sa.Integer(), server_default='0'),
        sa.Column('matched_pairs', sa.Integer(), server_default='0'),
        sa.Column('completed_meets', sa.Integer(), server_default='0'),
        sa.Column('total_users', sa.Integer(), server_default='0'),
        sa.Column('avg_arpu', sa.Numeric(10, 2), server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('date', name='uq_date')
    )
    op.create_index('idx_date_stats', 'user_statistics', ['date'])


def downgrade_p3():
    """Drop Phase 3 tables"""
    op.drop_table('user_statistics')
    op.drop_table('monthly_revenue')
    op.drop_table('tipping_transactions')
    op.drop_table('gifts')
    op.drop_table('call_ticket_purchases')
    op.drop_table('call_tickets')
    op.drop_table('fanclub_memberships')
    op.drop_table('live_streams')
