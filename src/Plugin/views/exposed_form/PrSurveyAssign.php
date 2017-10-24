<?php

namespace Drupal\pr_survey\Plugin\views\exposed_form;

use Drupal\views\Views;
use Drupal\Core\Form\FormState;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Render\Element\Checkboxes;
use Drupal\views\Plugin\views\exposed_form\ExposedFormPluginBase;

/**
 * Exposed form plugin that provides a basic exposed form.
 *
 * @ingroup views_exposed_form_plugins
 *
 * @ViewsExposedForm(
 *   id = "pr_survey_assign",
 *   title = @Translation("pr survey assign"),
 *   help = @Translation("pr survey assign")
 * )
 */
class PrSurveyAssign extends ExposedFormPluginBase {

  /**
   * {@inheritdoc}
   */
  public function exposedFormAlter(&$form, FormStateInterface $form_state) {
    parent::exposedFormAlter($form, $form_state);
    $form['actions']['submit']['#value'] = t('Check');
    $form['actions']['assign'] = [
      '#name' => 'assign',
      '#type' => 'submit',
      '#value' => t('Start survey'),
      '#validate' => [[$this, 'assignFormValidate']],
      '#submit' => [[$this, 'assignFormSubmit']],
    ];
  }

  /**
   * Form validator.
   *
   * @param array $form
   *   An associative array containing the structure of the form.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The current state of the form.
   *
   * @return array
   *   Array with input form data.
   */
  public function getAssignValues(&$form, FormStateInterface $form_state) {
    $exposed_raw_input = [];
    $values = $form_state->getValues();
    $exclude = [
      'submit',
      'form_build_id',
      'form_id',
      'form_token',
      'exposed_form_plugin',
      'reset',
      'assign',
    ];
    foreach ($values as $key => $value) {
      if (!empty($key) && !in_array($key, $exclude)) {
        if (is_array($value)) {
          $checked = Checkboxes::getCheckedCheckboxes($value);
          foreach ($checked as $option_id) {
            $exposed_raw_input[$option_id] = $value[$option_id];
          }
        }
        else {
          $exposed_raw_input[$key] = $value;
        }
      }
    }
    return $exposed_raw_input;
  }

  /**
   * Form validator.
   *
   * @param array $form
   *   An associative array containing the structure of the form.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The current state of the form.
   */
  public function assignFormValidate(&$form, FormStateInterface $form_state) {
    $view_name = $this->view->storage->id();
    $display = $this->view->current_display;
    $view = Views::getView($view_name);
    $view->setDisplay($display);
    $view->setArguments($this->view->args);
    $view->setExposedInput($this->getAssignValues($form, $form_state));
    $view->get_total_rows = TRUE;
    $view->execute();

    if (empty($view->total_rows)) {
      $message = $this->t("There aren't users to assign survey");
      $form_state->setErrorByName('', $message);
    }
  }

  /**
   * Form submit.
   *
   * @param array $form
   *   An associative array containing the structure of the form.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The current state of the form.
   */
  public function assignFormSubmit(&$form, FormStateInterface &$form_state) {
    // Preparing data for the batch.
    $info = [
      'id' => $this->view->storage->id(),
      'current_display' => $this->view->current_display,
      'args' => $this->view->args,
      'exposed_raw_input' => $this->getAssignValues($form, $form_state),
      'destination' => \Drupal::service('path.current')->getPath(),
      'survey' => reset($this->view->args),
    ];

    // Running batch to create empty results for some kind of user.
    $batch = [
      'title' => t('assign'),
      'operations' => [
        ['pr_survey_assign_callback', [$info]],
      ],
      'finished' => 'pr_survey_assign_finished_callback',
    ];
    batch_set($batch);
    $form_state = new FormState();
  }

}
