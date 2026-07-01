<?php
/**
 * Plugin Name: Find Your Team
 * Plugin URI:  https://make.wordpress.org/contribute/
 * Description: An interactive quiz that helps contributors find the right WordPress contribution team based on their interests and skills.
 * Version:     1.0.4
 * Author:      Maciej Pilarski
 * License:     GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: find-your-team
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'FYT_VERSION', '1.0.4' );
define( 'FYT_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'FYT_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

require_once FYT_PLUGIN_DIR . 'includes/class-fyt-quiz-data.php';
require_once FYT_PLUGIN_DIR . 'includes/class-fyt-shortcode.php';
require_once FYT_PLUGIN_DIR . 'includes/class-fyt-admin.php';

add_action( 'plugins_loaded', array( 'FYT_Shortcode', 'init' ) );
add_action( 'plugins_loaded', array( 'FYT_Admin', 'init' ) );
