<?php
/**
 * A track's questions as a list somebody edits (Track Builder, phase T3a).
 *
 * `WPCPM_Track_Questions` holds every rule the question editor needs and touches neither WordPress
 * nor Airtable, so this suite loads the real class and stands nothing in for it.
 *
 * Run from the plugin root:  php bin/test-track-questions.php
 */

if ( 'cli' !== PHP_SAPI ) {
	exit( 1 );
}

define( 'ABSPATH', __DIR__ . '/' );

require_once __DIR__ . '/../includes/tracks/class-wpcpm-track-questions.php';

$fails = 0;
$total = 0;

function ck( $label, $got, $want ) {
	global $fails, $total;

	++$total;

	if ( $got === $want ) {
		printf( "ok   %s\n", $label );
		return;
	}

	++$fails;
	printf( "FAIL %s\n     got:  %s\n     want: %s\n", $label, var_export( $got, true ), var_export( $want, true ) );
}

/** A track in the shape the definition stores: four questions across three groups. */
function questions() {
	return array(
		'Hours'        => array( 'type' => 'number', 'group' => 'hours', 'label' => 'Hours' ),
		'Slack name'   => array( 'type' => 'text', 'group' => 'onboarding', 'label' => 'Your Slack name' ),
		'WP.org name'  => array( 'type' => 'text', 'group' => 'onboarding', 'label' => 'Your WordPress.org name' ),
		'What you did' => array( 'type' => 'textarea', 'group' => 'project', 'label' => 'What you did' ),
	);
}

echo "=== Adding ===\n";

ck( 'a new onboarding question lands after the last onboarding question, not at the end',
    array_keys( WPCPM_Track_Questions::add( questions(), 'Your blog', array( 'type' => 'url', 'group' => 'onboarding' ) ) ),
    array( 'Hours', 'Slack name', 'WP.org name', 'Your blog', 'What you did' ) );

ck( 'a question of a group nobody uses yet goes at the end',
    array_keys( WPCPM_Track_Questions::add( questions(), 'Anything else', array( 'type' => 'textarea', 'group' => 'wrapup' ) ) ),
    array( 'Hours', 'Slack name', 'WP.org name', 'What you did', 'Anything else' ) );

ck( 'a column another question already uses is refused',
    WPCPM_Track_Questions::add( questions(), 'Slack name', array( 'type' => 'text', 'group' => 'project' ) ),
    null );

ck( 'a column name is taken verbatim, trailing space and all',
    array_keys( WPCPM_Track_Questions::add( questions(), 'Company ', array( 'type' => 'text', 'group' => 'project' ) ) ),
    array( 'Hours', 'Slack name', 'WP.org name', 'What you did', 'Company ' ) );

echo "\n=== Moving ===\n";

ck( 'up swaps with the question above it in the same group',
    array_keys( WPCPM_Track_Questions::move( questions(), 'WP.org name', 'up' ) ),
    array( 'Hours', 'WP.org name', 'Slack name', 'What you did' ) );

ck( 'down swaps the other way',
    array_keys( WPCPM_Track_Questions::move( questions(), 'Slack name', 'down' ) ),
    array( 'Hours', 'WP.org name', 'Slack name', 'What you did' ) );

ck( 'the first of its group cannot go up, and nothing else moves either',
    array_keys( WPCPM_Track_Questions::move( questions(), 'Slack name', 'up' ) ),
    array( 'Hours', 'Slack name', 'WP.org name', 'What you did' ) );

ck( 'the last of its group cannot go down',
    array_keys( WPCPM_Track_Questions::move( questions(), 'WP.org name', 'down' ) ),
    array( 'Hours', 'Slack name', 'WP.org name', 'What you did' ) );

ck( 'the only question of its group cannot move in either direction',
    array(
        array_keys( WPCPM_Track_Questions::move( questions(), 'What you did', 'up' ) ),
        array_keys( WPCPM_Track_Questions::move( questions(), 'What you did', 'down' ) ),
    ),
    array(
        array( 'Hours', 'Slack name', 'WP.org name', 'What you did' ),
        array( 'Hours', 'Slack name', 'WP.org name', 'What you did' ),
    ) );

ck( 'a column no question holds moves nothing',
    array_keys( WPCPM_Track_Questions::move( questions(), 'Nothing', 'up' ) ),
    array( 'Hours', 'Slack name', 'WP.org name', 'What you did' ) );

ck( 'a move keeps every question whole, not just its order',
    WPCPM_Track_Questions::move( questions(), 'WP.org name', 'up' )['Slack name'],
    array( 'type' => 'text', 'group' => 'onboarding', 'label' => 'Your Slack name' ) );

echo "\n=== Removing and renaming ===\n";

ck( 'remove takes one out and leaves the rest in order',
    array_keys( WPCPM_Track_Questions::remove( questions(), 'Slack name' ) ),
    array( 'Hours', 'WP.org name', 'What you did' ) );

ck( 'removing a column no question holds changes nothing',
    array_keys( WPCPM_Track_Questions::remove( questions(), 'Nothing' ) ),
    array( 'Hours', 'Slack name', 'WP.org name', 'What you did' ) );

ck( 'rename keeps the place the question held',
    array_keys( WPCPM_Track_Questions::rename( questions(), 'Slack name', 'Slack handle' ) ),
    array( 'Hours', 'Slack handle', 'WP.org name', 'What you did' ) );

ck( 'and keeps what it held',
    WPCPM_Track_Questions::rename( questions(), 'Slack name', 'Slack handle' )['Slack handle'],
    array( 'type' => 'text', 'group' => 'onboarding', 'label' => 'Your Slack name' ) );

ck( 'renaming onto another question is refused rather than overwriting it',
    WPCPM_Track_Questions::rename( questions(), 'Slack name', 'WP.org name' ),
    null );

ck( 'renaming a column no question holds is refused',
    WPCPM_Track_Questions::rename( questions(), 'Nothing', 'Something' ),
    null );

ck( 'renaming a question to the name it already has is allowed and changes nothing',
    array_keys( WPCPM_Track_Questions::rename( questions(), 'Slack name', 'Slack name' ) ),
    array( 'Hours', 'Slack name', 'WP.org name', 'What you did' ) );

echo "\n=== Who else writes this column ===\n";

/** Every other track, as the editor gathers them: two published and one draft. */
function others() {
    return array(
        array( 'label' => '150-hour Track', 'published' => true, 'columns' => array( 'Hours', 'Slack name' ) ),
        array( 'label' => 'Developer Track', 'published' => true, 'columns' => array( 'Slack name', 'What you did' ) ),
        array( 'label' => 'Marketing Track', 'published' => false, 'columns' => array( 'Slack name' ) ),
    );
}

ck( 'a column three tracks hold names all three, in the order they were given',
    WPCPM_Track_Questions::owners( 'Slack name', others() ),
    array(
        array( 'label' => '150-hour Track', 'published' => true ),
        array( 'label' => 'Developer Track', 'published' => true ),
        array( 'label' => 'Marketing Track', 'published' => false ),
    ) );

ck( 'a draft is named as one, because it does not write the column yet but will',
    WPCPM_Track_Questions::owners( 'Slack name', others() )[2]['published'],
    false );

ck( 'a column one track holds names one',
    WPCPM_Track_Questions::owners( 'Hours', others() ),
    array( array( 'label' => '150-hour Track', 'published' => true ) ) );

ck( 'a column nobody else holds names nobody',
    WPCPM_Track_Questions::owners( 'Your blog', others() ),
    array() );

ck( 'the comparison is exact: a trailing space is a different column',
    WPCPM_Track_Questions::owners( 'Slack name ', others() ),
    array() );

echo "\n=== Forking ===\n";

$text = array( 'type' => 'text', 'airtable_type' => 'singleLineText', 'group' => 'onboarding', 'label' => 'Your Slack name' );

ck( 'rewording the label keeps the column',
    WPCPM_Track_Questions::forks( array_merge( $text, array( 'label' => 'Your Slack name, please' ) ), $text ),
    false );

ck( 'so does a lead, a subgroup, help and a note',
    WPCPM_Track_Questions::forks( array_merge( $text, array( 'lead' => 'Before you start', 'subgroup' => 'Accounts', 'help' => 'The one you use in Slack', 'note' => 'Complete one of these.' ) ), $text ),
    false );

ck( 'changing the control forks',
    WPCPM_Track_Questions::forks( array_merge( $text, array( 'type' => 'textarea', 'airtable_type' => 'multilineText' ) ), $text ),
    true );

ck( 'and so does an Airtable type that no longer agrees with the control',
    WPCPM_Track_Questions::forks( array_merge( $text, array( 'airtable_type' => 'multilineText' ) ), $text ),
    true );

$select = array( 'type' => 'select', 'airtable_type' => 'singleSelect', 'group' => 'project', 'options' => array( 'Yes', 'No' ) );

ck( 'a new option forks',
    WPCPM_Track_Questions::forks( array_merge( $select, array( 'options' => array( 'Yes', 'No', 'Maybe' ) ) ), $select ),
    true );

ck( 'the same options in a different order forks, because Airtable keeps their order',
    WPCPM_Track_Questions::forks( array_merge( $select, array( 'options' => array( 'No', 'Yes' ) ) ), $select ),
    true );

ck( 'the same options unchanged do not',
    WPCPM_Track_Questions::forks( $select, $select ),
    false );

ck( 'a fork takes the column and the track key',
    WPCPM_Track_Questions::fork_name( 'Slack name', 'marketing' ),
    'Slack name - marketing' );

echo "\n=== A fork, afterwards ===\n";

ck( 'a forked column says what it came from while another track still holds that column',
    WPCPM_Track_Questions::forked_from( 'Slack name - marketing', 'marketing', others() ),
    'Slack name' );

ck( 'a column of the same shape whose stem nobody holds is not a fork',
    WPCPM_Track_Questions::forked_from( 'Coffee - marketing', 'marketing', others() ),
    '' );

ck( 'and neither is a column ending in another track key',
    WPCPM_Track_Questions::forked_from( 'Slack name - design', 'marketing', others() ),
    '' );

ck( 'a forked column is shared with nobody, which is what stops it forking a second time',
    WPCPM_Track_Questions::owners( 'Slack name - marketing', others() ),
    array() );

ck( 'so putting the control back reports a fork but finds no one to fork away from',
    array(
        WPCPM_Track_Questions::forks( $text, array_merge( $text, array( 'type' => 'textarea', 'airtable_type' => 'multilineText' ) ) ),
        WPCPM_Track_Questions::owners( 'Slack name - marketing', others() ),
    ),
    array( true, array() ) );

echo "\n=== A published column is fixed ===\n";

$published = array( 'Hours' => array( 'type' => 'number' ), 'Slack name' => array( 'type' => 'text' ) );

ck( 'a question in the published copy is locked',
    WPCPM_Track_Questions::locked( 'Slack name', $published ),
    true );

ck( 'a question added since the last publish is not',
    WPCPM_Track_Questions::locked( 'Your blog', $published ),
    false );

ck( 'and a track never published locks nothing',
    WPCPM_Track_Questions::locked( 'Slack name', array() ),
    false );

printf( "\n%s (%d checks)\n", $fails ? sprintf( '%d FAILURE(S)', $fails ) : 'ALL PASS', $total );

exit( $fails ? 1 : 0 );
