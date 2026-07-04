<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\User;
use App\Core\JWT;
use App\Core\MailService;
use App\Core\Response;

/**
 * AuthController — Authentification des clients et de l'admin.
 *
 * Routes :
 *   POST /api/auth/register      → création de compte client
 *   POST /api/auth/login         → connexion client → retourne un JWT
 *   POST /api/auth/admin/login   → connexion admin → retourne un JWT admin
 *
 * Deux types d'authentification dans ce projet :
 *
 *   1. Client (rôle "user") :
 *      - Compte individuel avec email + mot de passe hashé (bcrypt)
 *      - Token JWT avec user_id et role = "user"
 *      - Permet de réserver, commander, voir son espace personnel
 *
 *   2. Admin (rôle "admin") :
 *      - Mot de passe unique stocké dans .env (ADMIN_PASSWORD)
 *      - Pas de compte individuel : user_id = 0
 *      - Token JWT avec role = "admin"
 *      - Donne accès à tout le tableau de bord (/admin)
 */
class AuthController
{
    private User $model;

    public function __construct()
    {
        $this->model = new User();
    }

    /**
     * POST /api/auth/register — Création d'un compte client.
     *
     * Validations :
     *   - Tous les champs requis présents
     *   - Email au format valide
     *   - Mot de passe minimum 6 caractères
     *   - Email pas déjà utilisé
     *
     * Retourne un token JWT pour connexion immédiate après inscription.
     */
    public function register(): void
    {
        $body = $this->body();

        // Vérification des champs obligatoires
        foreach (['first_name', 'last_name', 'email', 'password'] as $field) {
            if (empty($body[$field])) {
                Response::error("Champ requis : {$field}");
                return;
            }
        }

        if (!filter_var($body['email'], FILTER_VALIDATE_EMAIL)) {
            Response::error('Email invalide');
            return;
        }

        if (strlen($body['password']) < 6) {
            Response::error('Mot de passe trop court (6 caracteres minimum)');
            return;
        }

        // Vérification que l'email n'existe pas déjà en base
        if ($this->model->emailExists($body['email'])) {
            Response::error('Cette adresse email est deja utilisee', 409);
            return;
        }

        // Création du compte (le mot de passe est hashé en bcrypt dans User::create)
        $userId = $this->model->create($body);
        $user   = $this->model->findById($userId);

        // Email de bienvenue — non bloquant (si SMTP non configuré, l'inscription réussit quand même)
        $prenom = trim((string) $user['first_name']);
        MailService::send(
            (string) $user['email'],
            'Bienvenue sur le portail Maison Saclay',
            "Bonjour {$prenom},\n\nVotre compte a bien été créé sur le portail Maison Saclay.\n\nVous recevrez par e-mail les confirmations de vos réservations, commandes et messages vocaux.\n\nCordialement,\nMaison Saclay"
        );

        Response::success([
            'token' => $this->token($userId),
            'user'  => $user,
        ], 'Compte cree avec succes', 201);
    }

    /**
     * POST /api/auth/login — Connexion d'un client.
     *
     * Vérifie l'email + le mot de passe hashé (password_verify contre bcrypt).
     * Retourne un token JWT valide 7 jours.
     * Le hash du mot de passe est retiré de la réponse avant envoi.
     */
    public function login(): void
    {
        $body = $this->body();

        if (empty($body['email']) || empty($body['password'])) {
            Response::error('Email et mot de passe requis');
            return;
        }

        $user = $this->model->findByEmail(strtolower(trim($body['email'])));

        // password_verify() compare le mot de passe fourni avec le hash bcrypt en base
        if (!$user || !password_verify($body['password'], $user['password_hash'])) {
            Response::error('Email ou mot de passe incorrect', 401);
            return;
        }

        // Sécurité : on ne renvoie jamais le hash du mot de passe au client
        unset($user['password_hash']);

        Response::success([
            'token' => $this->token((int) $user['id']),
            'user'  => $user,
        ], 'Connexion reussie');
    }

    /**
     * POST /api/auth/admin/login — Connexion administrateur.
     *
     * Pas de compte en base : l'admin s'authentifie avec un mot de passe unique
     * défini dans le fichier .env (ADMIN_PASSWORD).
     *
     * hash_equals() est utilisé pour comparer les mots de passe en temps constant
     * (protection contre les attaques par timing).
     *
     * Retourne un token JWT avec role = "admin" valable 7 jours.
     */
    public function adminLogin(): void
    {
        $body     = $this->body();
        $password = (string) ($body['password'] ?? '');
        $expected = trim((string) ($_ENV['ADMIN_PASSWORD'] ?? ''));

        if ($expected === '') {
            Response::error('ADMIN_PASSWORD manquant dans la configuration', 500);
            return;
        }

        // Comparaison en temps constant pour éviter les attaques par timing
        if ($password === '' || !hash_equals($expected, $password)) {
            Response::error('Mot de passe administrateur incorrect', 401);
            return;
        }

        try {
            // user_id = 0 car l'admin n'est pas un compte utilisateur individuel
            $token = JWT::encode(['user_id' => 0, 'role' => 'admin'], JWT::getSecret());
        } catch (\RuntimeException $e) {
            Response::error($e->getMessage(), 500);
            return;
        }

        Response::success(['token' => $token], 'Connexion administrateur reussie');
    }

    /** Génère un JWT pour un client (rôle "user"). */
    private function token(int $userId): string
    {
        return JWT::encode(['user_id' => $userId, 'role' => 'user'], JWT::getSecret());
    }

    /** Lit le corps JSON de la requête HTTP. */
    private function body(): array
    {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }
}
