#include<stdio.h>

typedef struct dataset{
  int data[5][5];

}dataset;
    dataset d = {{ {1,2,3,4,5},{1,4,9,16,25}}};  //y=x^2
int main(){
    // printf("%d",d.data[1][1]);
  return 0;
}