<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /** Role with access to every department portal and the /admin area. */
    public const ROLE_ADMIN = 'admin';

    /** Role for an external Lead who logs in to the Leads Portal. */
    public const ROLE_LEAD = 'lead';

    /** Department portals a non-admin user can be assigned to. */
    public const PORTAL_ROLES = ['sales', 'education', 'english', 'immigration', 'accommodation'];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'lead_id',
        'iaa_licence_number',
        'iaa_licence_expiry',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at'  => 'datetime',
            'last_login_at'      => 'datetime',
            'iaa_licence_expiry' => 'date',
            'password' => 'hashed',
        ];
    }

    /**
     * Whether this user is an admin (full access to /admin and every portal).
     */
    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    /**
     * Whether this user is an external lead logging into the Leads Portal.
     */
    public function isLead(): bool
    {
        return $this->role === self::ROLE_LEAD;
    }

    /**
     * Whether this user may open the given department portal.
     * Admins may open any portal; everyone else only their own.
     */
    public function canAccessPortal(string $portal): bool
    {
        return $this->isAdmin() || $this->role === $portal;
    }

    /**
     * Path the user should land on after logging in.
     */
    public function homeRoute(): string
    {
        if ($this->isLead()) {
            return '/portal/lead/dashboard';
        }
        return in_array($this->role, self::PORTAL_ROLES, true)
            ? "/portal/{$this->role}/dashboard"
            : '/admin/dashboard';
    }

    /** The Lead record this account owns — only set for role='lead' users. */
    public function lead()
    {
        return $this->belongsTo(Lead::class);
    }
}
