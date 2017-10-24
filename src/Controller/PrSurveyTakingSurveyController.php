<?php

namespace Drupal\pr_survey\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\pr_survey_result\Plugin\SurveyResultPluginManager;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Class TakingSurveyController.
 *
 * @package Drupal\pr_survey\Controller
 */
class PrSurveyTakingSurveyController extends ControllerBase {
  protected $surveyResultPlugin;
  protected $accessCheck;

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    $survey_result_plugin = $container->get('plugin.manager.survey_result_plugin');
    return new static($survey_result_plugin);
  }

  /**
   * {@inheritdoc}
   */
  public function __construct(SurveyResultPluginManager $survey_result_plugin) {
    $this->surveyResultPlugin = $survey_result_plugin;
  }

  /**
   * Callback.
   */
  public function callback() {
    if ($instance = $this->surveyResultPlugin->getCurrentInstance()) {
      $events = $instance->getCurrentEvents(TRUE);
    }
    else {
      $events = [
        [
          'event' => 'addMessage',
          'data' => [
            'type' => 'info',
            'value' => t('There are no surveys available for you at the moment.'),
          ],
        ],
      ];
    }

    $response['#attached']['drupalSettings']['prSurveyTaking'] = $events;
    $response['#attached']['library'][] = 'pr_survey/pr-survey.taking';
    $response['chat'] = [
      '#cache' => ['max-age' => 0],
      '#theme' => 'pr_survey',
      '#type' => 'marketing',
    ];
    return $response;
  }

}
