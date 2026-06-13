package com.ecommerce.order.event;

public class OrderPlacedEvent {
  private String orderId;
  private String userEmail;
  private double amount;
  private int totalItems;
  private String status;

  public OrderPlacedEvent() {
  }

  public OrderPlacedEvent(String orderId, String userEmail, double amount, int totalItems, String status) {
    this.orderId = orderId;
    this.userEmail = userEmail;
    this.amount = amount;
    this.totalItems = totalItems;
    this.status = status;
  }

  public String getOrderId() {
    return orderId;
  }

  public void setOrderId(String orderId) {
    this.orderId = orderId;
  }

  public String getUserEmail() {
    return userEmail;
  }

  public void setUserEmail(String userEmail) {
    this.userEmail = userEmail;
  }

  public double getAmount() {
    return amount;
  }

  public void setAmount(double amount) {
    this.amount = amount;
  }

  public int getTotalItems() {
    return totalItems;
  }

  public void setTotalItems(int totalItems) {
    this.totalItems = totalItems;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }
}
