<?php
// Add this at the top of hide-login.php to check if it's included multiple times
error_log('hide-login.php is being included');

define( 'HELLO_ELEMENTOR_CHILD_VERSION', '2.0.0' );

/**
 * Load child theme scripts & styles.
 *
 * @return void
 */
function hello_elementor_child_scripts_styles() {

	wp_enqueue_style(
		'hello-elementor-child-style',
		get_stylesheet_directory_uri() . '/style.min.css',
		[
			'hello-elementor-theme-style',
		],
		HELLO_ELEMENTOR_CHILD_VERSION
	);

}
add_action( 'wp_enqueue_scripts', 'hello_elementor_child_scripts_styles', 20 );


//| ENQUE ADMIN PANEL STYLES
function my_custom_admin_styles() {
    wp_enqueue_style('custom-admin-styles', get_stylesheet_directory_uri() . '/admin.min.css');
}
add_action('admin_enqueue_scripts', 'my_custom_admin_styles');



//| CHANGE LABEL ON ADMIN MENU TO "BLOG"
function change_post_menu_label() {
    global $menu;
    $menu[5][0] = 'Blog'; // Change the label of the Posts menu
  }
  add_action('admin_menu', 'change_post_menu_label');

  require_once get_stylesheet_directory() . '/php/no-comments.php';
  require_once get_stylesheet_directory() . '/php/allow-svg.php';

  add_action('init', function() {
    global $wp_rewrite;
    error_log(print_r($wp_rewrite->wp_rewrite_rules(), true));
});



//| DEBUGGING
