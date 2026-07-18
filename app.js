var app = angular.module('expenseApp', ['ngRoute']);

// Configure App Routing
app.config(function($routeProvider, $locationProvider) {
  $locationProvider.hashPrefix(''); // Avoid default formatting bugs
  $routeProvider
    .when('/login', {
      templateUrl: 'login.html',
      controller: 'LoginController'
    })
    .when('/dashboard', {
      templateUrl: 'dashboard.html',
      controller: 'ExpenseController'
    })
    .when('/profile', {
      templateUrl: 'profile.html',
      controller: 'ProfileController'
    })
    .otherwise({ redirectTo: '/login' });
});

// Main Shared Controller for Global Variables
app.controller('MainController', function($scope, $location, $rootScope) {
  $scope.isSidebarOpen = false;
  $scope.isDarkMode = true; 
  $scope.selectedCurrency = '₹';
  $scope.isAuthenticated = false;

  $scope.toggleSidebar = function() { $scope.isSidebarOpen = !$scope.isSidebarOpen; };
  $scope.toggleTheme = function() {
    $scope.isDarkMode = !$scope.isDarkMode;
    $rootScope.$broadcast('themeChanged');
  };

  $scope.navigateTo = function(path) {
    $scope.isSidebarOpen = false;
    $location.path(path);
  };

  $scope.logout = function() {
    $scope.isAuthenticated = false;
    $scope.isSidebarOpen = false;
    $location.path('/login');
  };
});

// Login View Controller
app.controller('LoginController', function($scope, $location) {
  $scope.loginData = { username: '', password: '' };
  $scope.errorMessage = '';

  $scope.handleLogin = function() {
    // Basic structural demonstration logic
    if ($scope.loginData.username && $scope.loginData.password) {
      $scope.$parent.isAuthenticated = true;
      $location.path('/dashboard');
    } else {
      $scope.errorMessage = 'Please complete all required fields.';
    }
  };
});

// Profile View Controller
app.controller('ProfileController', function($scope) {
  $scope.user = {
    name: 'Alex Mercer',
    email: 'alex.mercer@matrix.io',
    joined: '2026-01-15',
    tier: 'Premium Analyst Account'
  };
});

// Main Dashboard Controller
app.controller('ExpenseController', function($scope, $timeout) {
  $scope.isModalOpen = false;
  $scope.selectedCategory = null;
  $scope.Math = window.Math;

  // Shared Data Model
  if (!$scope.$parent.transactions) {
    $scope.$parent.transactions = [
      { type: 'income', name: 'Monthly Salary', amount: 3000, category: 'Salary', date: '2026-07-01', paymentType: 'Bank Transfer', comment: 'July pay' },
      { type: 'expense', name: 'Grocery Run', amount: 150, category: 'Food', date: '2026-07-05', paymentType: 'Credit Card', comment: 'Weekly items' },
      { type: 'expense', name: 'Electric Bill', amount: 90, category: 'Bills', date: '2026-07-10', paymentType: 'Debit Card', comment: 'Power bill' },
      { type: 'expense', name: 'New Shoes', amount: 110, category: 'Shopping', date: '2026-07-12', paymentType: 'Credit Card', comment: 'Running shoes' }
    ];
  }

  $scope.resetForm = function() {
    $scope.newItem = {
      type: 'expense', name: '', amount: null,
      category: 'Food', date: new Date(), paymentType: 'Cash', comment: ''
    };
  };
  $scope.resetForm();

  $scope.openAddModal = function() { $scope.isModalOpen = true; };
  $scope.closeAddModal = function() { $scope.isModalOpen = false; };

  $scope.getTotalIncome = function() {
    return $scope.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  };
  $scope.getTotalExpenses = function() {
    return $scope.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  };
  $scope.getProfit = function() {
    return $scope.getTotalIncome() - $scope.getTotalExpenses();
  };

  $scope.deleteTransaction = function(item) {
    const index = $scope.transactions.indexOf(item);
    if (index > -1) {
      $scope.transactions.splice(index, 1);
      $scope.updateChart();
      if($scope.selectedCategory) {
        const remaining = $scope.transactions.some(t => t.type === 'expense' && t.category === $scope.selectedCategory);
        if(!remaining) $scope.clearFilter();
      }
    }
  };

  $scope.addTransaction = function() {
    let formattedDate = $scope.newItem.date instanceof Date ? 
      $scope.newItem.date.toISOString().split('T')[0] : $scope.newItem.date;
    
    $scope.transactions.push({
      type: $scope.newItem.type,
      name: $scope.newItem.name,
      amount: parseFloat($scope.newItem.amount),
      category: $scope.newItem.category,
      date: formattedDate,
      paymentType: $scope.newItem.paymentType,
      comment: $scope.newItem.comment
    });

    $scope.closeAddModal();
    $scope.resetForm();
    $scope.updateChart();
  };

  $scope.categoryFilter = function(item) {
    if (!$scope.selectedCategory) return true;
    return item.category === $scope.selectedCategory;
  };
  $scope.clearFilter = function() { $scope.selectedCategory = null; };

  var chartInstance = null;
  $scope.updateChart = function() {
    var categories = {};
    $scope.transactions.forEach(function(t) {
      if (t.type === 'expense') {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      }
    });

    var labels = Object.keys(categories);
    var data = Object.values(categories);

    if (chartInstance) { chartInstance.destroy(); }

    var canvas = document.getElementById('expenseChart');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    
    // Balanced aesthetic palettes replacing the outdated neon colors
    var chartThemeColors = $scope.isDarkMode ? 
      ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#a855f7'] : 
      ['#4f46e5', '#059669', '#d97706', '#db2777', '#9333ea'];
      
    var gridLabelColor = $scope.isDarkMode ? '#f9fafb' : '#1f2937';
    var chartBorderColor = $scope.isDarkMode ? '#111827' : '#ffffff';

    chartInstance = new Chart(ctx, {
      type: 'doughnut', // Cleaned structure presentation
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: chartThemeColors,
          borderColor: chartBorderColor,
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: gridLabelColor, font: { family: 'SF Pro Display', weight: '500' } }
          }
        },
        onClick: function(e, activeElements) {
          if (activeElements.length > 0) {
            var clickedIndex = activeElements[0].index;
            $timeout(function() {
              $scope.selectedCategory = labels[clickedIndex];
            });
          }
        }
      }
    });
  };

  $scope.$on('themeChanged', function() { $scope.updateChart(); });
  $timeout(function() { $scope.updateChart(); }, 100);
});