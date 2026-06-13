package com.ecommerce.order.event;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class KafkaOrderPublisher {

  private static final Logger LOGGER = LoggerFactory.getLogger(KafkaOrderPublisher.class);

  private final KafkaTemplate<String, Object> kafkaTemplate;

  @Value("${kafka.topic.order-placed:order-events}")
  private String orderPlacedTopic;

  public KafkaOrderPublisher(KafkaTemplate<String, Object> kafkaTemplate) {
    this.kafkaTemplate = kafkaTemplate;
  }

  public void publishOrderPlaced(String orderId, String userEmail, double amount, int totalItems, String status) {
    OrderPlacedEvent event = new OrderPlacedEvent(orderId, userEmail, amount, totalItems, status);
    kafkaTemplate.send(orderPlacedTopic, orderId, event)
        .whenComplete((result, ex) -> {
          if (ex == null) {
            LOGGER.info("Published order event for orderId={} to topic={}", orderId, orderPlacedTopic);
          } else {
            LOGGER.warn("Failed to publish order event for orderId={}: {}", orderId, ex.getMessage());
          }
        });
  }
}
