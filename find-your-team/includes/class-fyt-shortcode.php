<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class FYT_Shortcode {

	public static function init() {
		add_shortcode( 'find_your_team', array( __CLASS__, 'render' ) );
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
		add_action( 'wp_ajax_fyt_get_results', array( __CLASS__, 'ajax_get_results' ) );
		add_action( 'wp_ajax_nopriv_fyt_get_results', array( __CLASS__, 'ajax_get_results' ) );
	}

	public static function enqueue_assets() {
		wp_register_style(
			'find-your-team',
			FYT_PLUGIN_URL . 'assets/css/find-your-team.css',
			array(),
			FYT_VERSION
		);

		wp_register_script(
			'find-your-team',
			FYT_PLUGIN_URL . 'assets/js/find-your-team.js',
			array(),
			FYT_VERSION,
			true
		);

		wp_localize_script(
			'find-your-team',
			'fytData',
			array(
				'ajaxUrl'   => admin_url( 'admin-ajax.php' ),
				'nonce'     => wp_create_nonce( 'fyt_nonce' ),
				'questions' => FYT_Quiz_Data::get_questions(),
				'i18n'      => array(
					'next'          => __( 'Next', 'find-your-team' ),
					'back'          => __( 'Back', 'find-your-team' ),
					'seeResults'    => __( 'Find My Team', 'find-your-team' ),
					'restart'       => __( 'Start Over', 'find-your-team' ),
					'yourTopTeam'   => __( 'Your Best Match', 'find-your-team' ),
					'otherTeams'    => __( 'Other Great Fits', 'find-your-team' ),
					'visitTeam'     => __( 'Visit Team Page', 'find-your-team' ),
					'selectOne'     => __( 'Please choose an answer to continue.', 'find-your-team' ),
					'loading'       => __( 'Finding your team…', 'find-your-team' ),
					'questionOf'    => __( 'Question %1$s of %2$s', 'find-your-team' ),
					'exploreMore'   => __( 'Explore All Teams', 'find-your-team' ),
					'exploreUrl'    => 'https://make.wordpress.org/',
				),
			)
		);
	}

	public static function render( $atts ) {
		wp_enqueue_style( 'find-your-team' );
		wp_enqueue_script( 'find-your-team' );

		ob_start();
		include FYT_PLUGIN_DIR . 'templates/quiz.php';
		return ob_get_clean();
	}

	public static function ajax_get_results() {
		check_ajax_referer( 'fyt_nonce', 'nonce' );

		$raw_tags = isset( $_POST['tags'] ) ? $_POST['tags'] : array();

		if ( ! is_array( $raw_tags ) ) {
			wp_send_json_error( 'Invalid data.' );
		}

		$tags   = array_map( 'sanitize_text_field', $raw_tags );
		$teams  = FYT_Quiz_Data::score_teams( $tags );

		$response = array(
			'top'    => array_slice( $teams, 0, 1 )[0],
			'others' => array_slice( $teams, 1, 4 ),
		);

		// Strip internal score/tags before sending.
		foreach ( $response['others'] as &$t ) {
			unset( $t['score'], $t['tags'] );
		}
		unset( $response['top']['score'], $response['top']['tags'] );

		wp_send_json_success( $response );
	}
}
