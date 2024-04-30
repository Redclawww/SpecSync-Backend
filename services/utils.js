import  axios  from 'axios';

export const getDataFromUrl = async (url) => {
    const html = await axios({
        method: 'get',
        url: `https://www.gsmarena.com${url}`,
    });

    return html.data;
};

export const getPrice = (text) => {
    const value = text.replace(',', '').split(' ');
    return {
        currency: value[0],
        price: parseFloat(value[1]),
    }

}