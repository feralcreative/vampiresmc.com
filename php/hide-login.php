<?php

// Redirect /dashboard to the WordPress login page
function custom_dashboard_login_redirect($wp) {
    // Get the current request URI
    $request_uri = trim($wp->request, '/');

    // Check if the request is for /dashboard
    if ($request_uri === 'dashboard') {
        // Load the default WordPress login page template
        wp_redirect(wp_login_url());
        exit;
    }
}
add_action('parse_request', 'custom_dashboard_login_redirect');

// Block access to wp-login.php for non-authenticated users
function block_wp_login_access() {
    if (strpos($_SERVER['REQUEST_URI'], 'wp-login.php') !== false && !is_user_logged_in()) {
        // Redirect to home or 404
        wp_redirect(home_url('/404'));
        exit;
    }
}
add_action('init', 'block_wp_login_access');

// Redirect unauthenticated users from /wp-admin to /404
function redirect_unauthenticated_wp_admin() {
    if (!is_user_logged_in() && is_admin()) {
        wp_redirect(home_url('/404'));
        exit;
    }
}
add_action('admin_init', 'redirect_unauthenticated_wp_admin');
