<?php

//Begin Really Simple Security session cookie settings
@ini_set('session.cookie_httponly', true);
@ini_set('session.cookie_secure', true);
@ini_set('session.use_only_cookies', true);
//END Really Simple Security cookie settings
//Begin Really Simple Security key
define('RSSSL_KEY', 'Z2HGjr7BeRGayLPseFGdrhAhEnp7lq2xJ1hi3Nrpq0BbIEopAAfuwkSyKf2ekgD4');
//END Really Simple Security key
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't have to use the web site, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * Database settings
 * * Secret keys
 * * Database table prefix
 * * Localized language
 * * ABSPATH
 *
 * @link https://wordpress.org/support/article/editing-wp-config-php/
 *
 * @package WordPress
 */

 define ( 'WP_DEBUG' , FALSE );
 define ( 'UPLOADS' , 'media' );
 define('WP_MEMORY_LIMIT', '128M');


// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'wp_vmc_db' );

/** Database username */
define( 'DB_USER', 'root' );

/** Database password */
define( 'DB_PASSWORD', 'root' );

/** Database hostname */
define( 'DB_HOST', 'localhost' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',          ',9c=X:VuetE_eRVD1]$.h5fREx0NQK{0;UJ v,g5^W~?tX:(]_o;f1_:0W,#vAHp' );
define( 'SECURE_AUTH_KEY',   '_N,ey:ayrw.%VbgI}vckZNmXP5l {;W4WFZj)G8SgbAPQh}=ihEm(bNd(YRqY8TD' );
define( 'LOGGED_IN_KEY',     'Zeh#BZ,i),M:p|R!|;G5FP[9&n;p?UPAt&`Fq|[CpQ8E!e/8eB=4U|Np4s1.!iSP' );
define( 'NONCE_KEY',         'XP@0H 6):r{muwQGf_]  ?.Fch~2Sey9Bs~xH5i7oj>uWoU%}uD0yt!,Gk?_#4F*' );
define( 'AUTH_SALT',         'eN>l2SU2CEC`{16Lzeqa(T}wC!O*oU!p28M1XlyByG3f#beBt?KSO@).@`RzRI~c' );
define( 'SECURE_AUTH_SALT',  'q~*,1v=x!=T@Elrw%`Smv<ju~R`LUbp]E;C_^CJBFSf|uP6vX>WwaqZ6x$)EdHJk' );
define( 'LOGGED_IN_SALT',    'M5w<df(srohbsnGtT8>xTOAf&&j+.zB&NhU!@Ol=VD2 &PBW+<M@y+G;lt2Lv8B%' );
define( 'NONCE_SALT',        'KQq9GnsRg8ct4|hIcz<]LL?Of}*{sYoGBdNu?@&F#.1 :xT.wWu&22k^~3$eZ{z>' );
define( 'WP_CACHE_KEY_SALT', 'jOORzo}=5Psjld-1Yk#aRfBK;X,teUyTG27lXA,x)7eZ zyB7yi,fw:FQ^4Db9h5' );


/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = 'wp_';

/* Add any custom values between this line and the "stop editing" line. */

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://wordpress.org/support/article/debugging-in-wordpress/
 */
if ( ! defined( 'WP_DEBUG' ) ) {
	define( 'WP_DEBUG', false );
}

/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';