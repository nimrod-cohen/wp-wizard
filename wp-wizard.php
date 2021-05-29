<?php 
/*
Plugin Name: WP-Wizard
Plugin URI: https://www.google.com/search?q=who+is+the+dude
Description: This plugin adds a beautiful Q&A wizard to your site
Version: 0.0.2
Author: Nimrod Cohen
Text Domain: wp-wizard
Domain Path: /languages
Author URI: https://www.google.com/search?q=who+is+the+dude
License: Free for all and all purposes without warrenty and no attribution required. just use the damn thing as you please.
*/
class WPWizard {
  
  function __construct() {
    add_action('init', [$this, 'initialize']);
  }

  function initialize() {
    add_action('wp_enqueue_scripts', [$this,'enqueueAssets']);
    add_action('wp_ajax_save_wizard_results',[$this, 'saveResults']);
    add_action('wp_ajax_nopriv_save_wizard_results',[$this, 'saveResults']);
  }

  function saveResults()
  {
    $customerIO = new CustomerIO();

    $customerIO->createCustomer($_REQUEST["email"],null);

    $customerIO->sendEvent('questionnaire', $_REQUEST["email"],$_REQUEST);

    echo json_encode(["error" => false]);
    die;
  }

  function enqueueAssets()
	{
		wp_register_script("jsutils-js",plugin_dir_url(__FILE__).DIRECTORY_SEPARATOR."js".DIRECTORY_SEPARATOR."jsutils.js",[]);
		wp_register_script("wpwizard-js",plugin_dir_url(__FILE__).DIRECTORY_SEPARATOR."js".DIRECTORY_SEPARATOR."wpwizard.js",['jsutils-js']);
		wp_enqueue_script("jsutils-js");
    wp_enqueue_script("wpwizard-js");

    wp_register_style("wpwizard-style",plugin_dir_url(__FILE__).DIRECTORY_SEPARATOR."css".DIRECTORY_SEPARATOR."wpwizard.css");
    wp_enqueue_style("wpwizard-style");

		wp_localize_script( 'wpwizard-js', 'wpwizard',
			 ['ajax_url' => admin_url( 'admin-ajax.php' )]
    );
	}
}

$wizard = new WPWizard();

include_once(plugin_dir_path(__FILE__).'updater.php');

$updater = new WPWizardUpdater(__FILE__); // instantiate updater class
$updater->setUsername('nimrod-cohen');
$updater->setRepository( 'wp-wizard' );
$updater->initialize();
?>