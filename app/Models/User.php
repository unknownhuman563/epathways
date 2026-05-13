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
            'email_verified_at' => 'datetime',
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
        return in_array($this->role, self::PORTAL_ROLES, true)
            ? "/portal/{$this->role}/dashboard"
            : '/admin/dashboard';
    }
}
